import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { Cart } from 'src/modules/cart/cart.entity';
import { OrderResponseDTO } from 'src/modules/orders/dto/order-response.dto';
import { Order } from 'src/modules/orders/entities/order.entity';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { User } from 'src/modules/users/user.entity';

import { Product } from '../products/entities/product.entity';
import { RoleForUser } from '../roles/role-user.enum';

import { OrderDTO } from './dto/order.dto';
import { SingleOrderResponse } from './dto/single-order-response.dto';
import { BuyerOrder } from './entities/buyer-order.entity';
import { Status } from './entities/order-status.enum';

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

      if (!orders.length) {
        throw new NotFoundException(Errors.ORDERS_NOT_FOUND);
      }

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

  async findByUserIdAndOrderId(
    userId: string,
    orderId: number,
  ): Promise<SingleOrderResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const orders = await this.orderRepository.find({
        where: [
          { vendorId: userId, orderId },
          { buyerId: userId, orderId },
        ],
        relations: ['products', 'products.images'],
        order: { createdAt: 'DESC' },
      });

      if (!orders.length) {
        throw new NotFoundException(Errors.ORDERS_NOT_FOUND);
      }

      const partnerId =
        user.role === RoleForUser.VENDOR
          ? orders[0].buyerId
          : orders[0].vendorId;

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
        order: orders.map((order) => new OrderResponseDTO(order)),
        userName: partnerName,
        userId: partnerId,
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

  async createOrdersForUser(
    userId: string,
    shippingPrice: number,
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
      buyerOrder.isPaid = false;
      buyerOrder.createdAt = new Date();
      buyerOrder.paymentId = '';
      buyerOrder.shipping = shippingPrice;
      buyerOrder.price = totalPrice;
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

  async rejectOrder(vendorId: string, orderId: number): Promise<void> {
    try {
      const order = await this.orderRepository.findOne({
        where: { orderId, vendorId },
      });

      if (!order) {
        throw new NotFoundException(Errors.ORDER_NOT_FOUND);
      }

      order.status = Status.REJECTED;

      await this.orderRepository.save(order);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_REJECT_ORDER);
    }
  }
}
