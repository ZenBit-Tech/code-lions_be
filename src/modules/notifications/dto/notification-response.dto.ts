import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';
import { Errors } from 'src/common/errors';

import { Type } from '../entities/notification-type.enum';

export class NotificationResponseDTO {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the notification',
    type: String,
  })
  id: string;

  @ApiProperty({
    example: 'Hi Jon. You have a new notification.',
    description: 'Text of the notification',
    type: String,
  })
  @IsString({ message: Errors.NOTIFICATION_TEXT_IS_STRING })
  @IsNotEmpty({ message: Errors.NOTIFICATION_TEXT_CANNOT_BE_EMPTY })
  text: string;

  @ApiProperty({
    example: 'Shipping updates',
    description: 'The type of the notification',
    enum: Type,
  })
  type: Type;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the notification was created',
    type: Date,
  })
  createdAt: Date;
}
