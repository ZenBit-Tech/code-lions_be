import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber, IsUUID, IsArray } from 'class-validator';
import { Address } from 'src/modules/orders/entities/address.entity';

export class CreateOrderDTO {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the vendor',
    type: String,
  })
  @IsUUID()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the buyer',
    type: String,
  })
  @IsUUID()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({
    example: 15000,
    description: 'The price of the order',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    example: `{Canada, Street1, Street2, ...}`,
    description: 'The address of the order',
    type: Address,
  })
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({
    example: ['product1', 'product2'],
    description: 'The products of the order',
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  productIds: string[];
}
