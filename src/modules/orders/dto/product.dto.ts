import { ApiProperty } from '@nestjs/swagger';

import { IsUUID, IsString, IsNumber } from 'class-validator';

export class ProductDto {
  @ApiProperty({
    example: '1c674384-f944-401b-949b-b76e8793bdc1',
    description: 'The ID of the product in the cart',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    example:
      'https://img.kwcdn.com/thumbnail/s/f09fce1e307adcde849148ecad30f7d5_fdd36fbfe57d.jpg?imageView2/2/w/650/q/50/format/webp',
    description: 'The URL of the product image',
  })
  @IsString()
  productUrl: string;

  @ApiProperty({
    example: 'Cool product',
    description: 'The name of the product',
  })
  name: string;

  @ApiProperty({
    example: 'M',
    description: 'The size of the product',
  })
  @IsString()
  size: string;

  @ApiProperty({
    example: 'green',
    description: 'The color of the product',
  })
  @IsString()
  color: string;

  @ApiProperty({
    example: 7,
    description: 'The duration for which the product is reserved in the cart',
  })
  @IsNumber()
  duration: number;

  @ApiProperty({
    example: '123.00',
    description: 'The price of the product',
  })
  @IsNumber()
  price: number;
}
