import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { ResponseCartItemDto } from 'src/modules/cart/response-cart.dto';
import { OrderResponseDTO } from 'src/modules/orders/dto/order-response.dto';
import { Order } from 'src/modules/orders/entities/order.entity';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { User } from 'src/modules/users/user.entity';

import { Product } from '../products/entities/product.entity';

import { CreateBuyerOrderDTO } from './dto/create-buyer-order.dto';
import { CreateOrderDTO } from './dto/create-order.dto';
import { OrderDTO } from './dto/order.dto';
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
        where: { vendorId },
        relations: ['products', 'address', 'user'],
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

  async findAll(): Promise<OrderResponseDTO[]> {
    try {
      const orders = await this.orderRepository.find({
        relations: ['products', 'address', 'user'],
      });

      return orders.map((order) => new OrderResponseDTO(order));
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_ORDERS);
    }
  }

  async createOrder(createOrderDTO: CreateOrderDTO): Promise<OrderResponseDTO> {
    try {
      const { vendorId, buyerId, price, productIds } = createOrderDTO;

      const vendor = await this.userRepository.findOne({
        where: { id: vendorId },
      });
      const buyer = await this.userRepository.findOne({
        where: { id: buyerId },
      });
      const products = await this.productRepository.findByIds(productIds);

      if (!vendor || !buyer || products.length !== productIds.length) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const order = this.orderRepository.create({
        vendorId,
        buyerId,
        price,
        products,
        status: Status.NEW_ORDER,
      });

      await this.orderRepository.save(order);

      return new OrderResponseDTO(order);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_ORDER);
    }
  }

  async createBuyerOrder(
    responseCartItemDto: ResponseCartItemDto[],
  ): Promise<CreateBuyerOrderDTO> {
    const [{ userId }]: ResponseCartItemDto[] = responseCartItemDto;

    try {
      const buyer = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!buyer) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const ordersMap = new Map<string, OrderDTO>();

      for (const cartItem of responseCartItemDto) {
        const vendor = await this.userRepository.findOne({
          where: { id: cartItem.vendorId },
        });

        if (!vendor) {
          throw new NotFoundException(Errors.VENDOR_NOT_FOUND);
        }

        const product = {
          productId: cartItem.productId,
          productUrl: cartItem.productUrl,
          name: cartItem.name,
          size: cartItem.size,
          color: cartItem.color,
          duration: cartItem.duration,
          price: cartItem.price,
        };

        if (ordersMap.has(cartItem.vendorId)) {
          ordersMap.get(cartItem.vendorId).products.push(product);
        } else {
          ordersMap.set(cartItem.vendorId, {
            vendorName: vendor.name,
            products: [product],
          });
        }
      }

      const orders = Array.from(ordersMap.values());

      if (!orders.length) {
        throw new NotFoundException(Errors.ORDERS_CANNOT_BE_GENERATED);
      }

      const createBuyerOrderDTO: CreateBuyerOrderDTO = {
        orders,
        price: responseCartItemDto.reduce(
          (total, cartItem) => total + cartItem.price,
          0,
        ),
        address: {
          addressLine1: buyer.addressLine1,
          addressLine2: buyer.addressLine2,
          country: buyer.country,
          state: buyer.state,
          city: buyer.city,
        },
      };

      return createBuyerOrderDTO;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_ORDER);
    }
  }
}
