import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

import { Errors } from 'src/common/errors';

import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewCreatorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const createReviewDto: CreateReviewDto = request.body;

    if (!user || user.id !== createReviewDto.reviewerId) {
      throw new UnauthorizedException(Errors.REVIEW_ON_BEHALF_OF_OTHER_USER);
    }

    if (user.id === createReviewDto.userId) {
      throw new ConflictException(Errors.REVIEW_YOURSELF);
    }

    return true;
  }
}
