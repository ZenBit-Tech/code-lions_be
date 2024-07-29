import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '877f0535-eb91-4159-b51a-7c44ebbc9f37' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsNotEmpty()
  shippingPrice: number;
}
