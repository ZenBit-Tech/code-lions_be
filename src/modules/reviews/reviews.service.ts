import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan } from 'typeorm';

import { Errors } from 'src/common/errors';
import { getClientByUserId } from 'src/common/utils/getClientByUserId';
import getDateWithoutTime from 'src/common/utils/getDateWithoutTime';
import {
  LOW_RATINGS_COUNT_ONE,
  LOW_RATINGS_COUNT_TWO,
  DECIMAL_PRECISION,
  RATING_THREE,
  RENTAL_RULES_LINK,
  THIRTY_DAYS,
} from 'src/config';
import {
  EventsGateway,
  SocketWithAuth,
} from 'src/modules/events/events.gateway';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { CreateNotificationDTO } from 'src/modules/notifications/dto/create-notification.dto';
import { Type } from 'src/modules/notifications/entities/notification-type.enum';
import { Status as orderStatus } from 'src/modules/orders/entities/order-status.enum';
import { Order } from 'src/modules/orders/entities/order.entity';
import { User } from 'src/modules/users/user.entity';

import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,

    private readonly mailerService: MailerService,
  ) {}

  async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
    const { userId, reviewerId, text, rating, orderId } = createReviewDto;

    try {
      return await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const user = await transactionalEntityManager.findOne(User, {
            where: { id: userId },
          });
          const reviewer = await transactionalEntityManager.findOne(User, {
            where: { id: reviewerId },
          });

          if (!user || !reviewer) {
            throw new NotFoundException(Errors.USER_NOT_FOUND);
          }

          if (user.role === reviewer.role) {
            throw new ConflictException(
              Errors.CONFLICT_REVIEW_SAME_ROLE(user.role),
            );
          }

          const order = await transactionalEntityManager.findOne(Order, {
            where: { orderId },
          });

          if (!order) {
            throw new NotFoundException(Errors.ORDER_NOT_FOUND);
          }

          if (order.status !== orderStatus.RECEIVED || orderStatus.RETURNED) {
            throw new ConflictException(Errors.ORDER_NOT_RECEIVED);
          }

          const review = this.reviewRepository.create({
            userId: user.id,
            reviewerId: reviewer.id,
            orderId,
            text,
            rating,
            reviewerName: reviewer.name,
            reviewerAvatar: reviewer.photoUrl,
          });

          const createdReview = await transactionalEntityManager.save(review);

          await this.updateUserRating(user.id, transactionalEntityManager);

          await this.handleLowRatingReviews(user, rating);

          return createdReview;
        },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_REVIEW);
    }
  }

  private async handleLowRatingReviews(
    user: User,
    rating: number,
  ): Promise<void> {
    if (rating >= RATING_THREE) return;

    try {
      const lowRatingReviews = await this.reviewRepository.count({
        where: { userId: user.id, rating: LessThan(RATING_THREE) },
      });

      if (lowRatingReviews === LOW_RATINGS_COUNT_ONE) {
        const isMailSent = await this.mailerService.sendMail({
          receiverEmail: user.email,
          subject: 'You have received a low rating on CodeLions',
          templateName: 'low-rating-warning.hbs',
          context: {
            name: user.name,
            rating,
            rentalRulesLink: RENTAL_RULES_LINK,
          },
        });

        if (!isMailSent) {
          throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
        }
      } else if (lowRatingReviews >= LOW_RATINGS_COUNT_TWO) {
        user.isAccountActive = false;
        user.deactivationTimestamp = new Date();
        user.reactivationTimestamp = new Date(Date.now() + THIRTY_DAYS);

        await this.userRepository.save(user);

        const deactivationDate = getDateWithoutTime(user.deactivationTimestamp);
        const reactivationDate = getDateWithoutTime(user.reactivationTimestamp);

        const isMailSent = await this.mailerService.sendMail({
          receiverEmail: user.email,
          subject: 'Account Deactivated on CodeLions',
          templateName: 'account-deactivated.hbs',
          context: {
            name: user.name,
            rentalRulesLink: RENTAL_RULES_LINK,
            deactivationDate,
            reactivationDate,
          },
        });

        if (!isMailSent) {
          throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
        }

        const notification: CreateNotificationDTO = {
          type: Type.LOW_RATING,
          userId: user.id,
        };

        const client: SocketWithAuth = await getClientByUserId(
          this.eventsGateway.server,
          user.id,
        );

        await this.eventsGateway.handleCreateNotification(client, notification);
      }
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_HANDLE_LOW_RATING_REVIEWS,
      );
    }
  }

  async getReviews(): Promise<Review[]> {
    try {
      return await this.reviewRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_REVIEWS);
    }
  }

  async getReviewsByUserId(userId: string): Promise<Review[]> {
    try {
      return await this.reviewRepository.find({
        where: { userId },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_FETCH_REVIEWS_BY_USER_ID,
      );
    }
  }

  private async updateUserRating(
    userId: string,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    try {
      const reviewRepository = transactionalEntityManager.getRepository(Review);
      const userRepository = transactionalEntityManager.getRepository(User);

      const reviews = await reviewRepository.find({
        where: { userId },
      });

      if (reviews.length > 0) {
        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        );
        const averageRating = totalRating / reviews.length;
        const roundedAverageRating = parseFloat(
          averageRating.toFixed(DECIMAL_PRECISION),
        );

        await userRepository.update(userId, { rating: roundedAverageRating });
      }
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_UPDATE_USER_RATING,
      );
    }
  }

  async deleteReview(id: string): Promise<void> {
    try {
      await this.reviewRepository.delete(id);
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_DELETE_REVIEW);
    }
  }
}
