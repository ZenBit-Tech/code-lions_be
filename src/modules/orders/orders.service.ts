import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository, EntityManager } from 'typeorm';

import { Errors } from 'src/common/errors';
import { getClientByUserId } from 'src/common/utils/getClientByUserId';
import { ORDERS_ON_PAGE } from 'src/config';
import { OVERDUE_DAILY_FINE } from 'src/config';
import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';
import { Cart } from 'src/modules/cart/cart.entity';
import {
  EventsGateway,
  SocketWithAuth,
} from 'src/modules/events/events.gateway';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { CreateNotificationDTO } from 'src/modules/notifications/dto/create-notification.dto';
import { Type } from 'src/modules/notifications/entities/notification-type.enum';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { OrderResponseDTO } from 'src/modules/orders/dto/order-response.dto';
import { Order } from 'src/modules/orders/entities/order.entity';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { Review } from 'src/modules/reviews/review.entity';
import { RoleForUser } from 'src/modules/roles/role-user.enum';
import { StripeService } from 'src/modules/stripe/stripe.service';
import { User } from 'src/modules/users/user.entity';

import { OrderDTO } from './dto/order.dto';
import { SingleOrderResponse } from './dto/single-order-response.dto';
import { BuyerOrder } from './entities/buyer-order.entity';
import { Status } from './entities/order-status.enum';

type DateRange = { lower: Date; upper: Date };
interface GetOrdersOptions {
  where?: {
    key: keyof Order;
    value: string | DateRange;
  };
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

const everyMinute = 60000;

@Injectable()
export class OrdersService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<ProductResponseDTO>,
    @InjectRepository(BuyerOrder)
    private readonly buyerOrderRepository: Repository<BuyerOrder>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private mailerService: MailerService,
    @Inject(forwardRef(() => StripeService))
    private stripeService: StripeService,
  ) {}

  @Interval(everyMinute)
  async handleOverdueOrders(): Promise<void> {
    try {
      const now = new Date();
      const orders = await this.orderRepository.find({
        where: {
          status: Status.RECEIVED,
        },
      });

      for (const order of orders) {
        if (order.receivedAt) {
          const durationEndDate = new Date(order.receivedAt.getTime());

          durationEndDate.setDate(durationEndDate.getDate() + order.duration);

          if (now > durationEndDate) {
            order.status = Status.OVERDUE;
            await this.orderRepository.save(order);
          }
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_CHANGE_ORDER_STATUS,
      );
    }
  }

  async findByVendor(vendorId: string): Promise<OrderResponseDTO[]> {
    try {
      const vendor = await this.userRepository.findOne({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const orders = await this.orderRepository.find({
        where: { vendorId: vendorId },
        relations: ['products'],
        order: { createdAt: 'DESC' },
      });

      return orders.map((order) => new OrderResponseDTO(order));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_FETCH_ORDERS_BY_VENDOR,
      );
    }
  }

  async hasUserLeftReview(
    orderId: number,
    reviewerId: string,
  ): Promise<boolean> {
    const review = await this.reviewRepository.findOne({
      where: { orderId, reviewerId },
    });

    return !!review;
  }

  async findByUserIdAndOrderId(
    user: UserResponseDto,
    orderId: number,
  ): Promise<SingleOrderResponse> {
    try {
      const order = await this.orderRepository.find({
        where: [
          { vendorId: user.id, orderId },
          { buyerId: user.id, orderId },
        ],
        relations: ['products', 'products.images'],
        order: { createdAt: 'DESC' },
      });

      if (!order.length) {
        throw new NotFoundException(Errors.ORDERS_NOT_FOUND);
      }

      const hasLeftReview = await this.hasUserLeftReview(orderId, user.id);

      const partnerId =
        user.role === RoleForUser.VENDOR ? order[0].buyerId : order[0].vendorId;

      const partner = await this.userRepository.findOne({
        where: { id: partnerId },
      });

      if (!partner) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const partnerName = partner.name;
      const partnerAddress = {
        addressLine1: partner.addressLine1,
        addressLine2: partner.addressLine2,
        city: partner.city,
        state: partner.state,
        country: partner.country,
      };

      const orderData = {
        order: order.map((order) => new OrderResponseDTO(order)),
        userName: partnerName,
        userId: partnerId,
        hasLeftReview,
        address: partnerAddress,
      };

      return orderData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_ORDER);
    }
  }

  async getAllOrdersOfBuyer(
    buyerId: string,
    statuses: Status[],
  ): Promise<OrderResponseDTO[]> {
    try {
      const buyer = await this.userRepository.findOneById(buyerId);

      if (!buyer) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const statusesArray = Array.isArray(statuses) ? statuses : [statuses];

      const orders = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.products', 'product')
        .leftJoinAndSelect('product.images', 'image')
        .where('order.buyerId = :buyerId', { buyerId })
        .andWhere('order.status IN (:...statuses)', { statuses: statusesArray })
        .orderBy('order.createdAt', 'DESC')
        .getMany();

      return orders.length
        ? orders.map((order) => new OrderResponseDTO(order))
        : [];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_ORDERS);
    }
  }

  async createOrdersForUser(
    userId: string,
    shippingPrice: number,
    totalAmount: number,
    isPaid: boolean,
    paymentId: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const cartItems = await this.cartRepository.find({
        where: { userId: userId },
      });

      if (!cartItems.length) {
        throw new NotFoundException(Errors.CART_IS_EMPTY);
      }

      const ordersMap = new Map<string, OrderDTO>();

      for (const cartItem of cartItems) {
        const vendor = await this.userRepository.findOne({
          where: { id: cartItem.vendorId },
        });

        if (!vendor) {
          throw new NotFoundException(Errors.VENDOR_NOT_FOUND);
        }

        const product = await this.productRepository.findOne({
          where: { id: cartItem.productId },
        });

        if (!product) {
          throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
        }

        const productForOrder = {
          productId: cartItem.productId,
          productUrl: cartItem.productUrl,
          name: product.name,
          size: cartItem.size,
          color: cartItem.color,
          duration: cartItem.duration,
          price: cartItem.price,
        };

        if (ordersMap.has(cartItem.vendorId)) {
          ordersMap.get(cartItem.vendorId).products.push(productForOrder);
        } else {
          ordersMap.set(cartItem.vendorId, {
            vendorId: vendor.id,
            vendorName: vendor.name,
            products: [productForOrder],
          });
        }
      }

      const orders = Array.from(ordersMap.values());

      if (!orders.length) {
        throw new NotFoundException(Errors.ORDERS_CANNOT_BE_GENERATED);
      }

      const buyerOrder = new BuyerOrder();

      let totalPrice = 0;

      cartItems.forEach((item) => {
        totalPrice += parseFloat(String(item.price));
      });

      totalPrice += parseFloat(String(shippingPrice));

      buyerOrder.user = user;
      buyerOrder.isPaid = isPaid;
      buyerOrder.createdAt = new Date();
      buyerOrder.paymentId = paymentId;
      buyerOrder.shipping = shippingPrice;
      buyerOrder.price = totalAmount;
      buyerOrder.orders = [];

      for (const order of orders) {
        const newOrder = new Order();
        const maxDurationProduct = order.products.reduce(
          (maxProduct, currentProduct) => {
            return currentProduct.duration > (maxProduct?.duration || 0)
              ? currentProduct
              : maxProduct;
          },
          null,
        );

        newOrder.duration = maxDurationProduct.duration;
        newOrder.vendorId = order.vendorId;
        newOrder.buyerId = userId;
        newOrder.shipping = shippingPrice / orders.length;
        newOrder.products = [];

        for (const productDTO of order.products) {
          const product = await this.productRepository.findOne({
            where: { id: productDTO.productId },
          });

          if (!product) {
            throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
          }

          product.isAvailable = false;
          await this.productRepository.save(product);
          await this.cartRepository.delete({ productId: product.id });
          newOrder.products.push(product);
        }

        totalPrice = 0;
        order.products.forEach((product) => {
          totalPrice += parseFloat(String(product.price));
        });
        newOrder.price = totalPrice;
        newOrder.status = Status.NEW_ORDER;
        newOrder.createdAt = new Date();
        newOrder.address = {
          addressLine1: user.addressLine1,
          addressLine2: user.addressLine2,
          country: user.country,
          state: user.state,
          city: user.city,
        };

        buyerOrder.orders.push(newOrder);
      }

      await this.buyerOrderRepository.save(buyerOrder);
      await this.orderRepository.save(buyerOrder.orders);
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_ORDER);
    }
  }

  private async checkIfOrdersAreSentOrRejected(
    buyerOrderId: string,
  ): Promise<void> {
    const buyerOrder = await this.buyerOrderRepository.findOne({
      where: { id: buyerOrderId },
      relations: ['orders'],
    });

    if (!buyerOrder) {
      throw new NotFoundException(Errors.ORDER_NOT_FOUND);
    }

    const orders = buyerOrder.orders;

    const areAllOrdersSentOrRejected = orders.every(
      (order) =>
        order.status === Status.REJECTED || order.status === Status.SENT,
    );

    if (!areAllOrdersSentOrRejected) {
      return;
    }

    const sentOrders = orders.filter((order) => order.status === Status.SENT);
    const rejectedOrders = orders.filter(
      (order) => order.status === Status.REJECTED,
    );

    if (sentOrders.length === orders.length) {
      await this.stripeService.captureMoney(
        buyerOrder.paymentId,
        Number(buyerOrder.price),
      );
    } else if (rejectedOrders.length === orders.length) {
      await this.stripeService.returnMoney(buyerOrder.paymentId);
    } else {
      const amount = sentOrders.reduce(
        (total, order) => total + Number(order.price) + Number(order.shipping),
        0,
      );

      await this.stripeService.captureMoney(buyerOrder.paymentId, amount);
    }
  }

  async rejectOrder(
    user: UserResponseDto,
    orderId: number,
    rejectReason: string,
  ): Promise<void> {
    try {
      const order = await this.entityManager.findOne(Order, {
        where: [
          { vendorId: user.id, orderId },
          { buyerId: user.id, orderId },
        ],
        relations: ['products', 'buyerOrder'],
      });

      if (!order) {
        throw new NotFoundException(Errors.ORDER_NOT_FOUND);
      }

      order.status = Status.REJECTED;
      order.rejectedBy = user.role;
      order.rejectReason = rejectReason;

      await this.entityManager.save(order);

      for (const product of order.products) {
        product.isAvailable = true;
        await this.entityManager.save(product);
      }

      const partnerId =
        user.role === RoleForUser.VENDOR ? order.buyerId : order.vendorId;

      const partner = await this.entityManager.findOne(User, {
        where: { id: partnerId },
      });

      if (!partner) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const isMailSent = await this.mailerService.sendMail({
        receiverEmail: partner.email,
        subject: 'Order rejected on CodeLions!',
        templateName: 'reject-order.hbs',
        context: {
          orderNumber: order.orderId,
          role: user.role,
          rejectReason,
        },
      });

      if (!isMailSent) {
        throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
      }

      const notification: CreateNotificationDTO = {
        userId: order.buyerId,
        type: Type.ORDER_REJECTION,
        orderId: order.orderId,
      };

      const client: SocketWithAuth = await getClientByUserId(
        this.eventsGateway.server,
        order.buyerId,
      );

      await this.eventsGateway.handleCreateNotification(client, notification);

      await this.checkIfOrdersAreSentOrRejected(order.buyerOrder.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_REJECT_ORDER);
    }
  }

  async sendOrderByVendor(
    vendorId: string,
    orderId: number,
    trackingNumber: string,
  ): Promise<void> {
    try {
      const order = await this.entityManager.findOne(Order, {
        where: { orderId, vendorId },
        relations: ['buyerOrder'],
      });

      if (!order) {
        throw new NotFoundException(Errors.ORDER_NOT_FOUND);
      }

      order.status = Status.SENT;
      order.trackingNumber = trackingNumber;

      await this.entityManager.save(order);

      const buyer = await this.entityManager.findOne(User, {
        where: { id: order.buyerId },
      });

      if (!buyer) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const isMailSent = await this.mailerService.sendMail({
        receiverEmail: buyer.email,
        subject: 'Order sent on CodeLions!',
        templateName: 'sent-order.hbs',
        context: {
          orderNumber: order.orderId,
          trackingNumber,
        },
      });

      if (!isMailSent) {
        throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
      }

      const notificationBuyer: CreateNotificationDTO = {
        userId: buyer.id,
        type: Type.SHIPPING_UPDATES,
        orderId: order.orderId,
        shippingStatus: Status.SENT,
      };

      const notificationVendor: CreateNotificationDTO = {
        userId: order.vendorId,
        type: Type.SHIPPING_UPDATES,
        orderId: order.orderId,
        shippingStatus: Status.SENT,
      };

      const clientBuyer: SocketWithAuth = await getClientByUserId(
        this.eventsGateway.server,
        buyer.id,
      );

      const clientVendor: SocketWithAuth = await getClientByUserId(
        this.eventsGateway.server,
        order.vendorId,
      );

      await this.eventsGateway.handleCreateNotification(
        clientBuyer,
        notificationBuyer,
      );

      await this.eventsGateway.handleCreateNotification(
        clientVendor,
        notificationVendor,
      );

      await this.checkIfOrdersAreSentOrRejected(order.buyerOrder.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_SEND_ORDER);
    }
  }

  async receiveOrderByBuyer(buyerId: string, orderId: number): Promise<void> {
    try {
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const order = await transactionalEntityManager.findOne(Order, {
            where: { orderId, buyerId },
            relations: ['buyerOrder'],
          });

          if (!order) {
            throw new NotFoundException(Errors.ORDER_NOT_FOUND);
          }

          order.status = Status.RECEIVED;
          order.receivedAt = new Date();
          order.trackingNumber = null;

          await transactionalEntityManager.save(order);

          const vendor = await transactionalEntityManager.findOne(User, {
            where: { id: order.vendorId },
          });

          if (!vendor) {
            throw new NotFoundException(Errors.USER_NOT_FOUND);
          }

          const isMailSent = await this.mailerService.sendMail({
            receiverEmail: vendor.email,
            subject: 'Buyer received your order!',
            templateName: 'received-order.hbs',
            context: {
              orderNumber: order.orderId,
            },
          });

          if (!isMailSent) {
            throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
          }

          const notificationBuyer: CreateNotificationDTO = {
            userId: buyerId,
            type: Type.SHIPPING_UPDATES,
            orderId: order.orderId,
            shippingStatus: Status.RECEIVED,
          };

          const notificationVendor: CreateNotificationDTO = {
            userId: vendor.id,
            type: Type.SHIPPING_UPDATES,
            orderId: order.orderId,
            shippingStatus: Status.RECEIVED,
          };

          const clientBuyer: SocketWithAuth = await getClientByUserId(
            this.eventsGateway.server,
            buyerId,
          );

          const clientVendor: SocketWithAuth = await getClientByUserId(
            this.eventsGateway.server,
            vendor.id,
          );

          await this.eventsGateway.handleCreateNotification(
            clientBuyer,
            notificationBuyer,
          );

          await this.eventsGateway.handleCreateNotification(
            clientVendor,
            notificationVendor,
          );

          const totalOrderAmount = Number(order.price) + Number(order.shipping);
          const paymentIntentId = order.buyerOrder.paymentId;
          const currentFee = await this.stripeService.getApplicationFee();

          await this.stripeService.transferMoneyToVendor(
            vendor.stripeAccount,
            paymentIntentId,
            totalOrderAmount,
            Number(currentFee),
          );
        },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_RECEIVE_ORDER);
    }
  }

  async sendOrderByBuyer(
    buyerId: string,
    orderId: number,
    trackingNumber: string,
  ): Promise<void> {
    try {
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const order = await transactionalEntityManager.findOne(Order, {
            where: { orderId, buyerId },
          });

          if (!order) {
            throw new NotFoundException(Errors.ORDER_NOT_FOUND);
          }

          order.status = Status.SENT_BACK;
          order.trackingNumber = trackingNumber;

          await transactionalEntityManager.save(order);

          const vendor = await transactionalEntityManager.findOne(User, {
            where: { id: order.vendorId },
          });

          if (!vendor) {
            throw new NotFoundException(Errors.USER_NOT_FOUND);
          }

          const isMailSent = await this.mailerService.sendMail({
            receiverEmail: vendor.email,
            subject: 'Order sent back on CodeLions!',
            templateName: 'sent-back-order.hbs',
            context: {
              orderNumber: order.orderId,
              trackingNumber,
            },
          });

          if (!isMailSent) {
            throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
          }

          const notificationBuyer: CreateNotificationDTO = {
            userId: buyerId,
            type: Type.SHIPPING_UPDATES,
            orderId: order.orderId,
            shippingStatus: Status.SENT_BACK,
          };

          const notificationVendor: CreateNotificationDTO = {
            userId: vendor.id,
            type: Type.SHIPPING_UPDATES,
            orderId: order.orderId,
            shippingStatus: Status.SENT_BACK,
          };

          const clientBuyer: SocketWithAuth = await getClientByUserId(
            this.eventsGateway.server,
            buyerId,
          );

          const clientVendor: SocketWithAuth = await getClientByUserId(
            this.eventsGateway.server,
            vendor.id,
          );

          await this.eventsGateway.handleCreateNotification(
            clientBuyer,
            notificationBuyer,
          );

          await this.eventsGateway.handleCreateNotification(
            clientVendor,
            notificationVendor,
          );
        },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_SEND_ORDER);
    }
  }

  async returnOrder(vendorId: string, orderId: number): Promise<void> {
    try {
      const order = await this.orderRepository.findOne({
        where: { orderId, vendorId },
        relations: ['products'],
      });

      if (!order) {
        throw new NotFoundException(Errors.ORDER_NOT_FOUND);
      }

      order.status = Status.RETURNED;
      order.trackingNumber = null;

      for (const product of order.products) {
        product.isAvailable = true;
        await this.productRepository.save(product);
      }

      await this.orderRepository.save(order);

      const notificationBuyer: CreateNotificationDTO = {
        userId: order.buyerId,
        type: Type.SHIPPING_UPDATES,
        orderId: order.orderId,
        shippingStatus: Status.RETURNED,
      };

      const notificationVendor: CreateNotificationDTO = {
        userId: order.vendorId,
        type: Type.SHIPPING_UPDATES,
        orderId: order.orderId,
        shippingStatus: Status.RETURNED,
      };

      const clientBuyer: SocketWithAuth = await getClientByUserId(
        this.eventsGateway.server,
        order.buyerId,
      );

      const clientVendor: SocketWithAuth = await getClientByUserId(
        this.eventsGateway.server,
        order.vendorId,
      );

      await this.eventsGateway.handleCreateNotification(
        clientBuyer,
        notificationBuyer,
      );

      await this.eventsGateway.handleCreateNotification(
        clientVendor,
        notificationVendor,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_RETURN_ORDER);
    }
  }

  async setSentBack(orderId: number): Promise<void> {
    try {
      const order = await this.orderRepository.findOne({
        where: { orderId },
      });

      if (!order) {
        return;
      }

      order.status = Status.SENT_BACK;
      await this.orderRepository.save(order);
    } catch {
      throw new InternalServerErrorException(Errors.FAILED_TO_SET_SENT_BACK);
    }
  }

  async paySendOrder(
    buyerId: string,
    orderId: number,
    trackingNumber: string,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    try {
      const order = await this.orderRepository.findOne({
        where: { orderId, buyerId },
      });

      if (!order) {
        throw new NotFoundException(Errors.ORDER_NOT_FOUND);
      }

      order.trackingNumber = trackingNumber;
      await this.orderRepository.save(order);

      const vendor = await this.userRepository.findOne({
        where: { id: order.vendorId },
      });

      if (!vendor) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const receivedAt = new Date(order.receivedAt);
      const overdueDays = this.calculateOverdueDays(order.duration, receivedAt);
      const vendorStripeAccount = vendor.stripeAccount;

      const session = await this.stripeService.createOverdueSession(buyerId, {
        vendorStripeAccount,

        orderId: orderId,

        amount: overdueDays * OVERDUE_DAILY_FINE,
      });

      await this.mailerService.sendMail({
        receiverEmail: vendor.email,
        subject: 'Order sent back on CodeLions!',
        templateName: 'sent-back-order.hbs',
        context: {
          orderNumber: order.orderId,
          trackingNumber,
        },
      });

      const notificationBuyer: CreateNotificationDTO = {
        userId: buyerId,
        type: Type.SHIPPING_UPDATES,
        orderId: order.orderId,
        shippingStatus: Status.SENT_BACK,
      };

      const notificationVendor: CreateNotificationDTO = {
        userId: vendor.id,
        type: Type.SHIPPING_UPDATES,
        orderId: order.orderId,
        shippingStatus: Status.SENT_BACK,
      };

      const clientBuyer: SocketWithAuth = await getClientByUserId(
        this.eventsGateway.server,
        buyerId,
      );

      const clientVendor: SocketWithAuth = await getClientByUserId(
        this.eventsGateway.server,
        vendor.id,
      );

      await this.eventsGateway.handleCreateNotification(
        clientBuyer,
        notificationBuyer,
      );

      await this.eventsGateway.handleCreateNotification(
        clientVendor,
        notificationVendor,
      );

      return session;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_PAY_AND_SEND);
    }
  }

  private async getOrders(
    options?: GetOrdersOptions,
  ): Promise<{ orders: OrderResponseDTO[]; count: number }> {
    try {
      const queryBuilder = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.products', 'products')
        .leftJoinAndSelect('order.buyerOrder', 'buyerOrder')
        .select([
          'order.orderId',
          'order.status',
          'order.price',
          'order.createdAt',
          'order.vendorId',
          'order.buyerId',
          'products',
          'buyerOrder',
        ]);

      if (options?.where) {
        if (options.where.key === 'createdAt') {
          const dateRange = options.where.value as DateRange;

          queryBuilder.andWhere(
            `order.${options.where.key} BETWEEN :startDate AND :endDate`,
            {
              startDate: dateRange.lower,
              endDate: dateRange.upper,
            },
          );
        } else {
          queryBuilder
            .andWhere(`order.${options.where.key} = :${options.where.key}`)
            .setParameter(options.where.key, options.where.value);
        }
      }

      if (options?.status) {
        queryBuilder.andWhere('order.status = :status', {
          status: options.status,
        });
      }

      if (options?.sortBy && options?.sortOrder) {
        queryBuilder.orderBy(
          `order.${options.sortBy}`,
          options.sortOrder === 'ASC' ? 'ASC' : 'DESC',
        );
      }

      const page = options?.page || 1;

      const limit = options?.limit || ORDERS_ON_PAGE;

      const offset = (page - 1) * limit;

      queryBuilder.skip(offset).take(limit);

      const [orders, count] = await queryBuilder.getManyAndCount();

      const mappedOrders = orders.map((order) => new OrderResponseDTO(order));

      return {
        orders: mappedOrders,
        count: count,
      };
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_ORDERS);
    }
  }

  async findOrdersByVendor(
    vendorId: string,
    status: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
  ): Promise<{ orders: OrderResponseDTO[]; count: number }> {
    try {
      return await this.getOrders({
        page,
        limit,
        status,
        sortBy,
        sortOrder,
        where: {
          key: 'vendorId',
          value: vendorId,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_FETCH_VENDOR_ORDERS,
      );
    }
  }

  private calculateOverdueDays(duration: number, receivedAt: Date): number {
    const msInDay = 86400000;
    const dueDate = new Date(receivedAt);

    dueDate.setDate(dueDate.getDate() + duration);

    const currentDate = new Date();

    const diffTime = currentDate.getTime() - dueDate.getTime();

    const diffDays = Math.floor(diffTime / msInDay);

    return diffDays > 0 ? diffDays : 0;
  }
}
