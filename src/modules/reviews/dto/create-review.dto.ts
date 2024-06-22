import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsString, IsNotEmpty } from 'class-validator';
import { Errors } from 'src/common/errors';

export class CreateReviewDto {
  @IsString({ message: Errors.REVIEW_TEXT_NOT_STRING })
  @IsNotEmpty({ message: Errors.REVIEW_TEXT_NOT_EMPTY })
  @ApiProperty({
    example: 'Great service! The dress was in excellent condition.',
    description: 'The text of the review',
  })
  text: string;

  @IsInt({ message: Errors.RATING_MUST_BE_AN_INT })
  @ApiProperty({ example: 5, description: 'The rating given in the review' })
  rating: number;

  @IsString({ message: Errors.USER_ID_NOT_STRING })
  @IsNotEmpty({ message: Errors.USER_ID_NOT_EMPTY })
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user for whom the review was left',
  })
  userId: string;

  @IsString({ message: Errors.REVIEWER_ID_NOT_STRING })
  @IsNotEmpty({ message: Errors.REVIEWER_ID_NOT_EMPTY })
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user who left the review',
  })
  reviewerId: string;
}
