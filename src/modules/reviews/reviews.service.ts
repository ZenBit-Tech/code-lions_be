import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan } from 'typeorm';

import { Errors } from 'src/common/errors';
import {
  BAD_RATINGS_COUNT_ONE,
  BAD_RATINGS_COUNT_TWO,
  DECIMAL_PRECISION,
  RATING_THREE,
  RENTAL_RULES_LINK,
  TWO_MINUTES,
} from 'src/config';
import { MailerService } from 'src/modules/mailer/mailer.service';
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
    private readonly mailerService: MailerService,
  ) {}

  async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
    const { userId, reviewerId, text, rating } = createReviewDto;

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

        const review = this.reviewRepository.create({
          userId: user.id,
          reviewerId: reviewer.id,
          text,
          rating,
          reviewerName: reviewer.name,
          reviewerAvatar: reviewer.photoUrl,
        });

        const createdReview = await transactionalEntityManager.save(review);

        await this.updateUserRating(user.id, transactionalEntityManager);

        await this.handleLowRatingReviews(
          user,
          rating,
          transactionalEntityManager,
        );

        return createdReview;
      },
    );
  }

  private async handleLowRatingReviews(
    user: User,
    rating: number,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    if (rating >= RATING_THREE) return;

    const lowRatingReviews = await transactionalEntityManager.count(Review, {
      where: { userId: user.id, rating: LessThan(RATING_THREE) },
    });

    if (lowRatingReviews === BAD_RATINGS_COUNT_ONE) {
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
    } else if (lowRatingReviews >= BAD_RATINGS_COUNT_TWO) {
      user.isAccountActive = false;
      user.deactivationTimestamp = new Date();
      user.reactivationTimestamp = new Date(Date.now() + TWO_MINUTES);
      await transactionalEntityManager.save(user);

      const isMailSent = await this.mailerService.sendMail({
        receiverEmail: user.email,
        subject: 'Account Deactivated on CodeLions',
        templateName: 'account-deactivated.hbs',
        context: {
          name: user.name,
          rentalRulesLink: RENTAL_RULES_LINK,
        },
      });

      if (!isMailSent) {
        throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
      }
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
