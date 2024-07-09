import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { PRODUCTS_ON_PAGE } from 'src/config';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import {
  ProductsService,
  ProductsResponse,
} from 'src/modules/products/products.service';

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
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    schema: { type: 'number', default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Products on a page limit',
    schema: { type: 'number', default: PRODUCTS_ON_PAGE },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query',
    schema: { type: 'string' },
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PRODUCTS_ON_PAGE,
    @Query('search') search?: string,
  ): Promise<ProductsResponse> {
    return this.productsService.findAll(page, limit, search);
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

  @Get('item/:id')
  @ApiOperation({
    summary: 'Get product by id',
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
  async findById(@Param('id') id: string): Promise<ProductResponseDTO> {
    return this.productsService.findById(id);
  }
}
