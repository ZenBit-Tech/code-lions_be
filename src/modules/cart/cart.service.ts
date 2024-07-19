import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { Status } from 'src/modules/products/entities/product-status.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';

import { Cart } from './cart.entity';
import { ResponseCartItemDto } from './response-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToCart(
    userId: string,
    productId: string,
    duration: number,
    price: number,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const product = await this.productRepository.findOne({
        where: { id: productId, status: Status.PUBLISHED },
        relations: ['images', 'color'],
      });

      const { images, size, color } = product;

      if (!user || !product) {
        throw new NotFoundException(Errors.USER_OR_PRODUCT_NOT_FOUND);
      }

      const existingEntry = await this.cartRepository.findOne({
        where: { userId, productId },
      });

      if (existingEntry) {
        throw new ConflictException(Errors.PRODUCT_ALREADY_IN_CART);
      }

      const sortedImages: string[] = images.map((image) => image.url).sort();
      const productUrl: string = sortedImages[0];
      const productColor: string = color[0].color;

      const cartEntry = this.cartRepository.create({
        userId,
        productId,
        vendorId: product.vendorId,
        productUrl,
        size,
        color: productColor,
        duration,
        price,
      });

      await this.cartRepository.save(cartEntry);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_ADD_PRODUCT_TO_CART,
      );
    }
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    try {
      const result = await this.cartRepository.delete({ userId, productId });

      if (result.affected === 0) {
        throw new NotFoundException(Errors.CART_ENTRY_NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_REMOVE_PRODUCT_FROM_CART,
      );
    }
  }

  async getCart(userId: string): Promise<ResponseCartItemDto[]> {
    try {
      const cart = await this.cartRepository.find({
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      if (!cart) {
        throw new NotFoundException(Errors.CART_NOT_FOUND);
      }

      const validCartItems = await Promise.all(
        cart.map(async (item) => {
          const product = await this.productRepository.findOne({
            where: { id: item.productId },
          });

          if (!product || product.status === Status.INACTIVE) {
            await this.removeFromCart(userId, item.id);

            return null;
          }

          return {
            id: item.id,
            userId: item.userId,
            productId: item.productId,
            vendorId: item.vendorId,
            productUrl: item.productUrl,
            name: product.name,
            size: item.size,
            color: item.color,
            duration: item.duration,
            price: item.price,
            createdAt: item.createdAt,
          };
        }),
      );

      return validCartItems.filter((item) => item !== null);
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_RETRIEVE_CART);
    }
  }
}
