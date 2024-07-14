import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import {
  FIRST_PAGE,
  PRODUCTS_ON_PAGE,
  PRODUCTS_PER_VENDOR_PAGE,
} from 'src/config';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import {
  ProductsService,
  ProductsResponse,
} from 'src/modules/products/products.service';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { UserIdGuard } from 'src/modules/users/user-id.guard';

import { Order } from './entities/order.enum';
import { ProductsWithStatusResponse } from './products.service';

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

  @UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
  @Roles(Role.VENDOR)
  @Get('vendor/:id')
  @ApiOperation({
    summary: 'Get products by vendor ID',
    tags: ['Products Endpoints'],
    description: 'This endpoint returns a list of products by vendor ID.',
  })
  @ApiOkResponse({
    description: 'The list of products by vendor ID',
    // type: [ProductsWithStatusResponse],
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
    description: 'Products per page limit',
    schema: { type: 'number', default: PRODUCTS_ON_PAGE },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Order by date',
    schema: { type: 'string' },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the vendor',
  })
  async findByVendorId(
    @Query('page') page: number = FIRST_PAGE,
    @Query('limit') limit: number = PRODUCTS_PER_VENDOR_PAGE,
    @Param('id') vendorId: string,
    @Query('search') search?: string,
    @Query('order') order: Order = Order.DESC,
  ): Promise<ProductsWithStatusResponse> {
    return this.productsService.findByVendorId(
      page,
      limit,
      search,
      order,
      vendorId,
    );
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
    name: 'id',
    description: 'The id of the product',
  })
  async findById(@Param('id') id: string): Promise<ProductResponseDTO> {
    return this.productsService.findById(id);
  }
}
