import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Status } from 'src/modules/orders/entities/order-status.enum';

import { Type } from '../entities/notification-type.enum';

export class CreateNotificationDTO {
  @ApiProperty({
    example: 'Shipping updates',
    description: 'The type of the notification',
    enum: Type,
  })
  @IsEnum(Type)
  type: Type;

  @ApiProperty({
    example: '4',
    description: 'The ID of the order',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  orderId?: number;

  @ApiProperty({
    example: '8b96d532-0681-4ce4-8252-04f585fe9620',
    description: 'The ID of the user',
    type: String,
    required: false,
  })
  @IsOptional()
  userId?: string;

  @ApiProperty({
    example: 'Sent',
    description: 'The shipping status of the order',
    enum: Status,
    required: false,
  })
  @IsOptional()
  @IsEnum(Status)
  shippingStatus?: Status;
}
