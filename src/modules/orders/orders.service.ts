import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { ORDERS_ON_PAGE } from 'src/config';
import { Cart } from 'src/modules/cart/cart.entity';
import { OrderResponseDTO } from 'src/modules/orders/dto/order-response.dto';
import { Order } from 'src/modules/orders/entities/order.entity';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';

import { OrderDTO } from './dto/order.dto';
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

@Injectable()
export class OrdersService {
  constructor(
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
  ) {}

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
}
