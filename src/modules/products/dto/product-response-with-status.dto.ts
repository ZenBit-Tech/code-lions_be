import { ApiProperty } from '@nestjs/swagger';

import { Status } from 'src/modules/products/entities/product-status.enum';

import { ProductResponseDTO } from './product-response.dto';

export class ProductResponseWithStatusDto extends ProductResponseDTO {
  @ApiProperty({
    example: 'published',
    description: 'The status of the product',
    enum: Status,
  })
  status: Status;
}
