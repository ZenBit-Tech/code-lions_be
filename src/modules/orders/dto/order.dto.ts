import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsArray, IsUUID } from 'class-validator';

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
    example: '1c674384-f944-401b-949b-b76e8793bdc1',
    description: 'The ID of the vendor of the order',
  })
  @IsUUID()
  vendorId: string;

  @ApiProperty({
    example: ['product1', 'product2'],
    description: 'The products of the order',
    type: [ProductDto],
  })
  @IsArray()
  @IsNotEmpty()
  products: ProductDto[];
}
