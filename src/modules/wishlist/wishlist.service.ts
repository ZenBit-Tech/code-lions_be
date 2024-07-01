import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Errors } from 'src/common/errors';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';
import { Repository } from 'typeorm';

import { Wishlist } from './wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToWishlist(userId: string, productId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!user || !product) {
        throw new NotFoundException(Errors.USER_OR_PRODUCT_NOT_FOUND);
      }

      const existingEntry = await this.wishlistRepository.findOne({
        where: { userId, productId },
      });

      if (existingEntry) {
        throw new ConflictException(Errors.PRODUCT_ALREADY_IN_WISHLIST);
      }

      const wishlistEntry = this.wishlistRepository.create({
        userId,
        productId,
      });

      await this.wishlistRepository.save(wishlistEntry);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_ADD_PRODUCT_TO_WISHLIST,
      );
    }
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    try {
      const result = await this.wishlistRepository.delete({
        userId,
        productId,
      });

      if (result.affected === 0) {
        throw new NotFoundException(Errors.WISHLIST_ENTRY_NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_REMOVE_PRODUCT_FROM_WISHLIST,
      );
    }
  }

  async getWishlist(userId: string): Promise<Product[]> {
    try {
      const wishlist = await this.wishlistRepository.find({
        where: { userId },
        relations: ['product'],
        order: {
          createdAt: 'ASC',
        },
      });

      if (!wishlist) {
        throw new NotFoundException(Errors.WISHLIST_NOT_FOUND);
      }

      const validProducts = await Promise.all(
        wishlist.map(async (entry) => {
          const product = await this.productRepository.findOne({
            where: { id: entry.productId },
          });

          if (!product) {
            await this.removeFromWishlist(userId, entry.product.id);

            return null;
          }

          return product;
        }),
      );

      return validProducts.filter((product) => product !== null);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_RETRIEVE_WISHLIST,
      );
    }
  }
}
