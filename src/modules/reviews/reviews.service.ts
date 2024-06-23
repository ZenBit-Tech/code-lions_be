import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Errors } from 'src/common/errors';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity';

import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
    try {
      const { userId, reviewerId, text, rating } = createReviewDto;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      const reviewer = await this.userRepository.findOne({
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
      });

      const createdReview = await this.reviewRepository.save(review);

      await this.updateUserRating(review.userId);

      return createdReview;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_REVIEW);
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

  async updateUserRating(userId: string): Promise<void> {
    try {
      const reviews = await this.reviewRepository.find({
        where: { userId },
      });

      if (reviews.length > 0) {
        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        );
        const averageRating = totalRating / reviews.length;

        await this.userRepository.update(userId, { rating: averageRating });
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
