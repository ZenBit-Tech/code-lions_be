import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Status } from 'src/modules/orders/entities/order-status.enum';

import { Type } from '../entities/notification-type.enum';

export class CreateNotificationDTO {
  @ApiProperty({
    example: 'Order rejection',
    description: 'The type of the notification',
    enum: Type,
  })
  @IsEnum(Type)
  type: Type;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the order',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({
    example: 'shipped',
    description: 'The shipping status of the order',
    enum: Status,
    required: false,
  })
  @IsOptional()
  @IsEnum(Status)
  shippingStatus?: Status;
}
