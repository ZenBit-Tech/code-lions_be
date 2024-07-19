import { ApiProperty } from '@nestjs/swagger';

import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';

export class BestVendorsResponseDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the vendor',
  })
  vendorId: string;

  @ApiProperty({
    example: 'Some Vendor',
    description: 'The name of the vendor',
  })
  vendorName: string;

  @ApiProperty({
    example: 'https://example.com/photo.jpg',
    description: 'The URL of the vendor photo',
  })
  photoUrl: string;

  @ApiProperty({
    type: [Product],
    description: 'The products of the vendor',
  })
  products: ProductResponseDTO[];
}
