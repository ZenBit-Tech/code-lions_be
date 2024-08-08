import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
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
    example: '4',
    description: 'The ID of the order',
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  orderId?: number;

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
