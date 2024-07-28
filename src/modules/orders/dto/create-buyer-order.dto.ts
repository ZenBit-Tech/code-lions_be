import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber } from 'class-validator';

import { AddressDTO } from './address.dto';
import { OrderDTO } from './order.dto';

export class CreateBuyerOrderDTO {
  @ApiProperty({
    example: `{order1, order2, ...}`,
    description: 'The orders of the payment',
    type: OrderDTO,
  })
  @IsNotEmpty()
  orders: OrderDTO[];

  @ApiProperty({
    example: 15000,
    description: 'The price of the all orders',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    example: `{Canada, Street1, Street2, ...}`,
    description: 'The address of the order',
    type: AddressDTO,
  })
  @IsNotEmpty()
  address: AddressDTO;
}
