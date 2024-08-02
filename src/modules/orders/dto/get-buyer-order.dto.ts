import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

import { AddressDTO } from './address.dto';
import { OrderDTO } from './order.dto';

export class GetBuyerOrderDTO {
  @ApiProperty({
    example: `{order1, order2, ...}`,
    description: 'The orders of the payment',
    type: [OrderDTO],
  })
  @IsNotEmpty()
  orders: OrderDTO[];

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the buyer',
    type: String,
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 15000,
    description: 'The price of the all orders',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    example: 15,
    description: 'The shipping all orders',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  shipping: number;

  @ApiProperty({
    example: `{Canada, Street1, Street2, ...}`,
    description: 'The address of the order',
    type: AddressDTO,
  })
  @IsNotEmpty()
  address: AddressDTO;
}
