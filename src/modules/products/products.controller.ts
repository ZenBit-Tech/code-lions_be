import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import {
  FIRST_PAGE,
  PRODUCTS_ON_PAGE,
  PRODUCTS_PER_VENDOR_PAGE,
  DEFAULT_ORDER,
  DEFAULT_SORT,
} from 'src/config';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { ProductsAndCountResponseDTO } from 'src/modules/products/dto/products-count-response.dto';
import {
  ProductsResponse,
  ProductsService,
} from 'src/modules/products/products.service';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { UserIdGuard } from 'src/modules/users/user-id.guard';

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
    name: 'category',
    required: false,
    description: 'Product category',
    schema: { type: 'string' },
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
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price',
    schema: { type: 'number' },
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price',
    schema: { type: 'number' },
  })
  @ApiQuery({
    name: 'color',
    required: false,
    description: 'Product color',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'style',
    required: false,
    description: 'Product style',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Product size',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'The field for sorting',
    schema: { type: 'string', enum: ['name', 'price', 'date'] },
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'The order for sorting',
    schema: { type: 'string', enum: ['asc', 'desc'] },
  })
  async findAll(
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = PRODUCTS_ON_PAGE,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('color') color?: string,
    @Query('style') style?: string,
    @Query('size') size?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<ProductsResponse> {
    return this.productsService.findAll(
      category,
      page,
      limit,
      search,
      minPrice,
      maxPrice,
      color,
      style,
      size,
      sortBy,
      sortOrder,
    );
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
    type: ProductsAndCountResponseDTO,
  })
  @ApiNotFoundResponse({
    description: 'Not found vendor with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.USER_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: {
          type: 'string',
          example: Errors.USER_UNAUTHORIZED,
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch products by vendor',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_PRODUCTS_BY_VENDOR,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
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
    schema: { type: 'number', default: PRODUCTS_PER_VENDOR_PAGE },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'The field for sorting',
    schema: { type: 'string', enum: ['name', 'price', 'date'] },
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'The order for sorting',
    schema: { type: 'string', enum: ['asc', 'desc'] },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the vendor',
  })
  async findByVendorId(
    @Query('page') page: number = FIRST_PAGE,
    @Query('limit') limit: number = PRODUCTS_PER_VENDOR_PAGE,
    @Query('sortBy') sortBy: string = DEFAULT_SORT,
    @Query('sortOrder') sortOrder: string = DEFAULT_ORDER,
    @Param('id') vendorId: string,
    @Query('search') search?: string,
  ): Promise<ProductsAndCountResponseDTO> {
    return this.productsService.findByVendorId(
      page,
      limit,
      search,
      sortOrder,
      sortBy,
      vendorId,
    );
  }

  @Get('latest')
  @ApiOperation({
    summary: 'Get latest products',
    tags: ['Products Endpoints'],
    description:
      'This endpoint returns a list of products that were published recently.',
  })
  @ApiOkResponse({
    description: 'The list of latest products',
    type: [ProductResponseDTO],
  })
  @ApiNotFoundResponse({
    description: 'Latest products not found',
  })
  async findLatest(): Promise<ProductsAndCountResponseDTO> {
    return this.productsService.findLatest();
  }

  @Get('sizes')
  @ApiOperation({
    summary: 'Get products by all user`s sizes',
    tags: ['Products Endpoints'],
    description: 'This endpoint returns a list of products with certain sizes.',
  })
  @ApiOkResponse({
    description: 'The list of the certain size products',
    type: [ProductResponseDTO],
  })
  @ApiNotFoundResponse({
    description: 'Products by sizes were not found',
  })
  @ApiQuery({
    name: 'clothesSize',
    required: true,
    description: 'Clothes size to filter users by',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'jeansSize',
    required: true,
    description: 'Jeans size to filter users by',
    schema: { type: 'string' },
  })
  @ApiQuery({
    name: 'shoesSize',
    required: true,
    description: 'Shoes size to filter users by',
    schema: { type: 'string' },
  })
  async findBySize(
    @Query('clothesSize') clothesSize: string,
    @Query('jeansSize') jeansSize: string,
    @Query('shoesSize') shoesSize: string,
  ): Promise<ProductsAndCountResponseDTO> {
    return this.productsService.findBySize(clothesSize, jeansSize, shoesSize);
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

  @UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
  @Roles(Role.VENDOR)
  @Delete(':id/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product',
    tags: ['Product Endpoints'],
    description:
      'This endpoint softly deletes published products and deletes inactive products.',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: {
          type: 'string',
          example: Errors.USER_UNAUTHORIZED,
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Not found product with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.PRODUCT_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete the product',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_DELETE_PRODUCT,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the vendor',
  })
  @ApiParam({
    name: 'productId',
    description: 'The ID of the product',
  })
  async deleteProduct(
    @Param('id') vendorId: string,
    @Param('productId') productId: string,
  ): Promise<void> {
    return this.productsService.deleteProduct(vendorId, productId);
  }
}
