import { ApiProperty } from '@nestjs/swagger';

import { ProductResponseDTO } from './product-response.dto';

export class ProductsAndCountResponseDTO {
  @ApiProperty({
    type: [ProductResponseDTO],
    description: 'The list of products fetched',
  })
  products: ProductResponseDTO[];

  @ApiProperty({
    example: 1,
    description: 'The count of products fetched',
  })
  count: number;
}
