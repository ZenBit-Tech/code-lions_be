import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Errors } from 'src/common/errors';
import { ProductsService } from 'src/modules/products/products.service';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Fetches all brands',
    tags: ['Brands Endpoint'],
    description: 'This endpoint allows to get all brands.',
  })
  @ApiOkResponse({
    description: 'The brands have been successfully fetched.',
    type: [String],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch brands',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_BRANDS,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async getBrands(): Promise<string[]> {
    return await this.productsService.getBrands();
  }
}
