import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsNotEmpty()
  shippingPrice: number;
}
