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
import { GetBuyerOrderDTO } from './dto/get-buyer-order.dto';
import { OrderDTO } from './dto/order.dto';
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
            vendorId: vendor.id,
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
        userId: buyer.id,
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

  async payForOrder(getBuyerOrderDTO: GetBuyerOrderDTO): Promise<void> {
    const { userId, orders, price, address, shipping, createdAt } =
      getBuyerOrderDTO;

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const buyerOrder = new BuyerOrder();

      buyerOrder.price = price;
      buyerOrder.user = user;

      const productPromises = orders.map((order) =>
        Promise.all(
          order.products.map((product) =>
            this.productRepository.findOne({
              where: { id: product.productId },
            }),
          ),
        ),
      );

      const products = await Promise.all(productPromises);

      if (products.flat().includes(undefined)) {
        throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
      }

      const orderEntities = orders.map((orderDTO) => {
        const order = new Order();

        order.shipping = shipping / orderDTO.products.length;
        order.products = orderDTO.products.map((productDTO) => {
          return products
            .flat()
            .find((product) => product.id === productDTO.productId);
        });
        order.price = orderDTO.products.reduce(
          (total, cartItem) => total + cartItem.price,
          0,
        );
        order.status = Status.NEW_ORDER;
        order.createdAt = createdAt;
        order.vendorId = orderDTO.vendorId;
        order.buyerId = userId;
        order.address = address;

        return order;
      });

      buyerOrder.orders = orderEntities;

      await this.buyerOrderRepository.save(buyerOrder);
      await this.orderRepository.save(orderEntities);
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_ORDER);
    }
  }
}
