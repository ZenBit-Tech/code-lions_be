import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsArray } from 'class-validator';

import { ProductDto } from './product.dto';

export class OrderDTO {
  @ApiProperty({
    example: 'Victor',
    description: 'The name of the vendor',
    type: String,
  })
  @IsNotEmpty()
  vendorName: string;

  @ApiProperty({
    example: ['product1', 'product2'],
    description: 'The products of the order',
    type: [ProductDto],
  })
  @IsArray()
  @IsNotEmpty()
  products: ProductDto[];
}
