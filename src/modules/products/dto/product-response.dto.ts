import { ApiProperty } from '@nestjs/swagger';

import { Color } from 'src/modules/products/entities/color.entity';
import { Status } from 'src/modules/products/entities/product-status.enum';
import { ProductTypes } from 'src/modules/products/entities/product-types.enum';
import { Styles } from 'src/modules/products/entities/styles.enum';

export class VendorDTO {
  @ApiProperty({
    example: '2rm07r7r-t98p-5q9q-8p59-33sq0p8s3219',
    description: 'The ID of the vendor',
  })
  id: string;

  @ApiProperty({
    example: 'Oscar Perez',
    description: 'The name of the vendor',
  })
  name: string;

  @ApiProperty({
    example: '',
    description: 'The URL of photo of the vendor',
  })
  photoUrl: string;
}

export class ProductResponseDTO {
  @ApiProperty({
    example: '1rm07r7r-t98p-5q9q-8p59-33sq0p8s3219',
    description: 'The ID of the product',
  })
  id: string;

  @ApiProperty({
    example: 'Cool product',
    description: 'The name of the product',
  })
  name: string;

  @ApiProperty({
    example: 'cool-product',
    description: 'The slug of the product',
  })
  slug: string;

  @ApiProperty({
    example: 120.2,
    description: 'The price of the product',
  })
  price: number;

  @ApiProperty({
    example:
      'Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsumLorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum',
    description: 'The description of the product',
  })
  description: string;

  @ApiProperty({
    example: ['clothing', 'designers'],
    description: 'The categories of the product',
  })
  categories: string[];

  @ApiProperty({
    example: 'casual',
    description: 'The style of the product',
    enum: Styles,
  })
  style: Styles;

  @ApiProperty({
    example: 'published',
    description: 'The status of the product',
    enum: Status,
  })
  status: Status;

  @ApiProperty({
    example: 'dress',
    description: 'The type of the product',
    enum: ProductTypes,
  })
  type: ProductTypes;

  @ApiProperty({
    example: 'M',
    description: 'The size of the product',
  })
  size: string;

  @ApiProperty({
    example: [
      'https://example.com/images/big/408793385.jpg',
      'https://example.com/images/big/408793386.jpg',
    ],
    description: 'The images of the product',
  })
  images: string[];

  @ApiProperty({
    example: ['black', 'white'],
    description: 'The colors of the product',
  })
  colors: Color[];

  @ApiProperty({
    type: VendorDTO,
    description: 'The vendor of the product',
  })
  vendor: VendorDTO;

  @ApiProperty({
    example: '2024-06-28T18:04:24.000Z',
    description: 'The creation date of the product',
  })
  createdAt: Date;

  @ApiProperty({
    example: null,
    description: 'The last update date of the product',
  })
  lastUpdatedAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The deletion date of the user',
  })
  deletedAt: Date;
}
