import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { ProductsService } from 'src/modules/products/products.service';

@ApiTags('products')
@Controller('products')
@ApiInternalServerErrorResponse({
  description: 'Internal server error',
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all products',
    tags: ['Products Endpoints'],
    description: 'This endpoint returns a list of products.',
  })
  @ApiOkResponse({
    description: 'The list of products',
    type: [ProductResponseDTO],
  })
  findAll(): Promise<ProductResponseDTO[]> {
    return this.productsService.findAll();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get product by slug',
    tags: ['Products Endpoints'],
    description: 'This endpoint returns a product.',
  })
  @ApiOkResponse({
    description: 'The product',
    type: ProductResponseDTO,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  @ApiParam({
    name: 'slug',
    description: 'The slug of the product',
  })
  async findBySlug(@Param('slug') slug: string): Promise<ProductResponseDTO> {
    return this.productsService.findBySlug(slug);
  }
}
