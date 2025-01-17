import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';

import { IsInt, Max, Min } from 'class-validator';
import { Errors } from 'src/common/errors';
import { MAX_RATING, MIN_RATING } from 'src/config';

@Entity()
export class Review {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the review',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Great service! The dress was in excellent condition.',
    description: 'The text of the review',
  })
  @Column({ type: 'longtext', nullable: true })
  text: string;

  @ApiProperty({ example: 5, description: 'The rating given in the review' })
  @IsInt({ message: Errors.RATING_MUST_BE_AN_INT })
  @Min(MIN_RATING, { message: Errors.RATING_MIN })
  @Max(MAX_RATING, { message: Errors.RATING_MAX })
  @Column('int')
  rating: number;

  @ApiProperty({
    example: 1,
    description: 'The order number',
    type: Number,
  })
  @Column({ type: 'int' })
  orderId: number;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user who received the review',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user who gave the review',
  })
  @Column('uuid')
  reviewerId: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @Column()
  reviewerName: string;

  @ApiProperty({
    example: 'file-1718301871158-882823500.jpg',
    description: 'The reviewer profile photo',
  })
  @Column({
    nullable: true,
    default: null,
  })
  reviewerAvatar: string;

  @ApiProperty({
    example: new Date(),
    description: 'The date of the review',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  updateDatesBeforeInsert(): void {
    this.createdAt = new Date();
  }
}
