import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';

import { Errors } from 'src/common/errors';
import getDateWithoutTime from 'src/common/utils/getDateWithoutTime';
import {
  AVERAGE_RATING_FOUR_POINT_NINE,
  DURATION_FOURTEEN_DAYS,
  DURATION_SEVEN_DAYS,
  NUMBER_OF_FIVE_RATINGS,
  ORDERS_SUM_ZERO,
  PRICE_ONE_THOUSAND,
  PRICE_TWO_THOUSAND_FIVE_HUNDRED,
  RATING_FIVE,
} from 'src/config';
import { Status } from 'src/modules/products/entities/product-status.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { Review } from 'src/modules/reviews/review.entity';
import { User } from 'src/modules/users/user.entity';

import { Cart } from './cart.entity';
import { ResponseCartItemDto } from './response-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  private async checkUserEligibility(
    user: User,
    product: Product,
    duration: number,
    price: number,
  ): Promise<void> {
    if (
      !user.isAccountActive &&
      user.deactivationTimestamp &&
      user.reactivationTimestamp
    ) {
      const deactivationDate = getDateWithoutTime(
        new Date(user.deactivationTimestamp),
      );
      const reactivationDate = getDateWithoutTime(
        new Date(user.reactivationTimestamp),
      );

      throw new ConflictException(
        Errors.CONFLICT_ACCOUNT_DEACTIVATED(deactivationDate, reactivationDate),
      );
    }

    const userReviews = await this.reviewRepository.find({
      where: { userId: user.id },
    });

    const hasThreeFiveStarReviews =
      userReviews.filter((review) => review.rating === RATING_FIVE).length >=
      NUMBER_OF_FIVE_RATINGS;
    const isHighRated = user.rating >= AVERAGE_RATING_FOUR_POINT_NINE;

    const isEligibleForExtendedPrivileges =
      hasThreeFiveStarReviews && isHighRated;

    if (
      user.orders === ORDERS_SUM_ZERO ||
      user.rating < AVERAGE_RATING_FOUR_POINT_NINE
    ) {
      if (duration > DURATION_SEVEN_DAYS) {
        throw new ConflictException(Errors.INVALID_DURATION);
      }
      if (price > PRICE_ONE_THOUSAND) {
        throw new ConflictException(Errors.PRICE_LIMIT_EXCEEDED);
      }
    } else if (
      !isEligibleForExtendedPrivileges &&
      (duration === DURATION_FOURTEEN_DAYS ||
        price > PRICE_TWO_THOUSAND_FIVE_HUNDRED)
    ) {
      throw new ConflictException(Errors.EXTENDED_PRIVILEGES_REQUIRED);
    }
  }

  async addToCart(
    userId: string,
    productId: string,
    duration: number,
    price: number,
  ): Promise<void> {
    try {
      return await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const user = await transactionalEntityManager.findOne(User, {
            where: { id: userId },
          });
          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: productId, status: Status.PUBLISHED },
            relations: ['images', 'color'],
          });

          if (!user || !product) {
            throw new NotFoundException(Errors.USER_OR_PRODUCT_NOT_FOUND);
          }

          await this.checkUserEligibility(user, product, duration, price);

          const existingEntry = await transactionalEntityManager.findOne(Cart, {
            where: { userId, productId },
          });

          if (existingEntry) {
            throw new ConflictException(Errors.PRODUCT_ALREADY_IN_CART);
          }

          const sortedImages: string[] = product.images
            .map((image) => image.url)
            .sort();
          const productUrl: string = sortedImages[0];
          const productColor: string = product.color[0].color;

          const cartEntry = this.cartRepository.create({
            userId,
            productId,
            vendorId: product.vendorId,
            productUrl,
            size: product.size,
            color: productColor,
            duration,
            price,
          });

          await transactionalEntityManager.save(cartEntry);
        },
      );
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
