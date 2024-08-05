import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Shipping price', type: Number, example: 50 })
  @IsNumber()
  @IsNotEmpty()
  shippingPrice: number;

  @ApiProperty({ description: 'Total amount', type: Number, example: 100 })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({ description: 'Is paid', type: Boolean, example: true })
  @IsNumber()
  @IsNotEmpty()
  isPaid: boolean;

  @ApiProperty({ description: 'Payment id', type: String, example: '12345' })
  @IsNotEmpty()
  paymentId: string;
}
