import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { OrderResponseDTO } from 'src/modules/orders/dto/order-response.dto';
import { Order } from 'src/modules/orders/entities/order.entity';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { User } from 'src/modules/users/user.entity';

import { Product } from '../products/entities/product.entity';

import { CreateOrderDTO } from './dto/create-order.dto';
import { Address } from './entities/address.entity';
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
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
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
      const { vendorId, buyerId, price, addressId, productIds } =
        createOrderDTO;

      const vendor = await this.userRepository.findOne({
        where: { id: vendorId },
      });
      const buyer = await this.userRepository.findOne({
        where: { id: buyerId },
      });
      const address = await this.addressRepository.findOne({
        where: { id: addressId },
      });
      const products = await this.productRepository.findByIds(productIds);

      if (
        !vendor ||
        !buyer ||
        !address ||
        products.length !== productIds.length
      ) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const order = this.orderRepository.create({
        vendorId,
        buyerId,
        price,
        address,
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
}
