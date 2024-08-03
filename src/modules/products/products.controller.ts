import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  Query,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiServiceUnavailableResponse,
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
import { FileUploadRequest } from 'src/interceptors/file-upload/file-upload.interceptor';
import { ProductPdfUploadInterceptor } from 'src/interceptors/file-upload/product-pdf-upload.interceptor';
import { ProductPhotoUploadInterceptor } from 'src/interceptors/file-upload/product-photo-upload.interceptor';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { ProductsAndCountResponseDTO } from 'src/modules/products/dto/products-count-response.dto';
import { UpdateProductDto } from 'src/modules/products/dto/update-product.dto';
import { Status } from 'src/modules/products/entities/product-status.enum';
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.BUYER)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/:list')
  @ApiOperation({
    summary: 'Get product requests and published products list by admin',
    tags: ['Products Endpoints'],
    description:
      'This endpoint returns a list of product requests or published products list for admin.',
  })
  @ApiOkResponse({
    description: 'The list of product requests or products for admin',
    type: ProductsAndCountResponseDTO,
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
    description: 'Failed to fetch product requests or products for admin',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_PRODUCTS,
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
    name: 'list',
    description:
      'The list of product fetched for admin(requests or published products)',
  })
  async findAdmin(
    @Query('page') page: number = FIRST_PAGE,
    @Query('limit') limit: number = PRODUCTS_PER_VENDOR_PAGE,
    @Query('sortBy') sortBy: string = DEFAULT_SORT,
    @Query('sortOrder') sortOrder: string = DEFAULT_ORDER,
    @Param('list') list: Status,
    @Query('search') search?: string,
  ): Promise<ProductsAndCountResponseDTO> {
    return this.productsService.findAdminList(
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      list,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/approve/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update status of the product to published',
    tags: ['Products Endpoints'],
    description: 'This endpoint updates the status of product to published.',
  })
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The product request is approved successfully',
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
    description: 'Not found vendor or product with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.USER_OR_PRODUCT_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Service is unavailable',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 503 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SEND_EMAIL,
        },
        error: { type: 'string', example: 'Service Unavailable' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to approve the product request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_APPROVE_PRODUCT,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({
    name: 'productId',
    description: 'ID of product to approve',
  })
  async approveRequest(@Param('productId') productId: string): Promise<void> {
    return this.productsService.approveRequest(productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/reject/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reject the product request by admin',
    tags: ['Products Endpoints'],
    description:
      'This endpoint changes the status of the product request to rejected if admin rejects it.',
  })
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The product request is rejected successfully',
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
    description: 'Not found vendor or product with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.USER_OR_PRODUCT_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Service is unavailable',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 503 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SEND_EMAIL,
        },
        error: { type: 'string', example: 'Service Unavailable' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to reject the product request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_REJECT_PRODUCT,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({
    name: 'productId',
    description: 'ID of product to reject',
  })
  async rejectRequest(@Param('productId') productId: string): Promise<void> {
    return this.productsService.rejectRequest(productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete the product by admin',
    tags: ['Products Endpoints'],
    description: 'This endpoint soft deletes the product by admin.',
  })
  @ApiNoContentResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The product is soft deleted successfully',
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
    description: 'Not found vendor or product with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.USER_OR_PRODUCT_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Service is unavailable',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 503 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SEND_EMAIL,
        },
        error: { type: 'string', example: 'Service Unavailable' },
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
    name: 'productId',
    description: 'ID of product to soft delete',
  })
  async deleteProductByAdmin(
    @Param('productId') productId: string,
  ): Promise<void> {
    return this.productsService.deleteProductByAdmin(productId);
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

  @Post(':id/photo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Upload product photo',
    tags: ['Product Endpoints'],
    description: 'This endpoint is used by the vendor to upload product photo',
  })
  @ApiCreatedResponse({
    description: 'The photo has been successfully uploaded.',
    type: ProductResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file or request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPDATE_PHOTO_URL,
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiForbiddenResponse({
    description: 'Forbidden - No rights for uploading photos',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: {
          type: 'string',
          example: Errors.UNAUTHORIZED_TO_UPLOAD_PRODUCT_PHOTOS,
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
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
  @ApiInternalServerErrorResponse({
    description: 'Failed to upload photo',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPLOAD_PRODUCT_PHOTO,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'), ProductPhotoUploadInterceptor)
  @Roles(Role.VENDOR)
  async uploadPhoto(
    @Param('id') id: string,
    @Request() request: FileUploadRequest & { user: UserResponseDto },
  ): Promise<ProductResponseDTO> {
    if (request.uploadError) {
      throw new BadRequestException(request.uploadError.message);
    }
    const photoUrl = request.uploadedFileUrl;
    const updatedProduct = await this.productsService.updateProductPhoto(
      id,
      request.user.id,
      photoUrl,
    );

    return updatedProduct;
  }

  @Delete('photo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Delete product photo',
    tags: ['Product Endpoints'],
    description: 'This endpoint is used by the vendor to delete product photo',
  })
  @ApiQuery({
    name: 'file',
    type: String,
    required: true,
    description: 'Photo url',
  })
  @ApiOkResponse({
    description: 'The photo has been successfully deleted.',
    type: ProductResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.NO_PHOTO_URL,
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiForbiddenResponse({
    description: 'Forbidden - No rights for deleting photos',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: {
          type: 'string',
          example: Errors.FORBIDDEN_TO_DELETE_PRODUCT_PHOTOS_FROM_OTHER_VENDORS,
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete photo',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_DELETE_PRODUCT_PHOTO,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.VENDOR)
  async deletePhoto(
    @Request() request: Request & { user: UserResponseDto },
    @Query('file') photoUrl: string,
  ): Promise<ProductResponseDTO> {
    const updatedProduct = this.productsService.deleteProductPhoto(
      request.user.id,
      photoUrl,
    );

    return updatedProduct;
  }

  @Patch('photo/set-primary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Set product photo as primary',
    tags: ['Product Endpoints'],
    description:
      'This endpoint is used by the vendor to set a product photo as primary',
  })
  @ApiQuery({
    name: 'file',
    type: String,
    required: true,
    description: 'Photo url',
  })
  @ApiOkResponse({
    description: 'The photo has been successfully set as primary.',
    type: ProductResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.NO_PHOTO_URL,
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiForbiddenResponse({
    description: 'Forbidden - No rights for setting primary photo',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: {
          type: 'string',
          example: Errors.FORBIDDEN_TO_SET_PRIMARY_PHOTO_FROM_OTHER_VENDORS,
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to set primary photo',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SET_PRIMARY_PHOTO,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.VENDOR)
  async setPrimaryPhoto(
    @Request() request: Request & { user: UserResponseDto },
    @Query('file') photoUrl: string,
  ): Promise<ProductResponseDTO> {
    const updatedProduct = await this.productsService.setPrimaryPhoto(
      request.user.id,
      photoUrl,
    );

    return updatedProduct;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Update product',
    tags: ['Product Endpoints'],
    description: 'This endpoint is used by the vendor to update a product',
  })
  @ApiOkResponse({
    description: 'Product updated successfully',
    type: ProductResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example:
            'material must be one of the following values: chiffon, cotton, crepe, denim, lace, leather, linen, satin, silk, nylon, polyester, spandex, velvet, wool, viscose, textile, synthetic, rubber, foam, plastic',
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiNotFoundResponse({
    description:
      'Product not found or vendor not found or this product is not owned by this vendor',
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
    description: 'Failed to update product',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPDATE_PRODUCT,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.VENDOR)
  async updateProduct(
    @Request() request: Request & { user: UserResponseDto },
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDTO> {
    const updatedProduct = await this.productsService.updateProduct(
      id,
      request.user.id,
      updateProductDto,
    );

    return updatedProduct;
  }

  @Post(':id/pdf-file')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Upload product document',
    tags: ['Product Endpoints'],
    description:
      'This endpoint is used by the vendor to upload product document',
  })
  @ApiCreatedResponse({
    description: 'The document has been successfully uploaded.',
    type: ProductResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file or request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.INVALID_FILE_OR_REQUEST,
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiNotFoundResponse({
    description: '',
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
    description: 'Failed to upload product document',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPLOAD_PRODUCT_DOCUMENT,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'), ProductPdfUploadInterceptor)
  @Roles(Role.VENDOR)
  async uploadPdfFile(
    @Request() request: FileUploadRequest & { user: UserResponseDto },
    @Param('id') id: string,
  ): Promise<ProductResponseDTO> {
    if (request.uploadError) {
      throw new BadRequestException(request.uploadError.message);
    }
    const pdfUrl = request.uploadedFileUrl;

    const updatedProduct = await this.productsService.uploadPdfFile(
      id,
      request.user.id,
      pdfUrl,
    );

    return updatedProduct;
  }
}
