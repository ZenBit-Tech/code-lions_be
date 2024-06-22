import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';

import { JwtAuthGuard } from '../auth/auth.guard';
import { Role } from '../roles/role.enum';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';

import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewCreatorGuard } from './review-creator.guard';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiInternalServerErrorResponse({
  description: responseDescrptions.error,
  type: ErrorResponse,
})
@ApiForbiddenResponse({
  description: 'User does not have permission to access this resource',
  schema: {
    properties: {
      statusCode: { type: 'integer', example: 403 },
      message: {
        type: 'string',
        example: 'Forbidden resource',
      },
      error: { type: 'string', example: 'Forbidden' },
    },
  },
})
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  @UseGuards(ReviewCreatorGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new review',
    tags: ['Reviews Endpoints'],
    description: 'This endpoint creates a review.',
  })
  @ApiCreatedResponse({
    status: HttpStatus.CREATED,
    description: 'The review has been successfully created.',
    type: Review,
  })
  @ApiNotFoundResponse({
    description: 'Not found user with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.USER_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'You cannot review the other user role',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: {
          type: 'string',
          example: 'You cannot review the other user role',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: Errors.FAILED_TO_CREATE_REVIEW,
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_CREATE_REVIEW,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.BUYER, Role.VENDOR)
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewService.createReview(createReviewDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all reviews',
    tags: ['Reviews Endpoints'],
    description: 'This endpoint returns a list of reviews.',
  })
  @ApiOkResponse({
    description: responseDescrptions.success,
    type: [Review],
  })
  @ApiInternalServerErrorResponse({
    description: Errors.FAILED_TO_FETCH_REVIEWS,
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_REVIEWS,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.ADMIN)
  async getReviews(): Promise<Review[]> {
    return this.reviewService.getReviews();
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get reviews by user ID',
    tags: ['Reviews Endpoints'],
    description:
      'This endpoint returns a list of reviews for a specific user ID.',
  })
  @ApiOkResponse({
    description: 'The reviews have been successfully retrieved.',
    type: [Review],
  })
  @ApiInternalServerErrorResponse({
    description: Errors.FAILED_TO_FETCH_REVIEWS_BY_USER_ID,
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_REVIEWS_BY_USER_ID,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.BUYER, Role.VENDOR)
  async getReviewsByUserId(@Param('userId') userId: string): Promise<Review[]> {
    return this.reviewService.getReviewsByUserId(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review by ID' })
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The review has been successfully deleted.',
  })
  @ApiInternalServerErrorResponse({
    description: Errors.FAILED_TO_DELETE_REVIEW,
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_DELETE_REVIEW,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.ADMIN)
  async deleteReview(@Param('id') id: string): Promise<void> {
    await this.reviewService.deleteReview(id);
  }
}
