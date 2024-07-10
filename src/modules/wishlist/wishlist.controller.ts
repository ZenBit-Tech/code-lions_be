import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { UserIdGuard } from 'src/modules/users/user-id.guard';

import { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
@Roles(Role.BUYER)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({
  description: responseDescrptions.error,
  type: ErrorResponse,
})
@ApiForbiddenResponse({
  description: 'User does not have permission to access this resource',
  schema: {
    properties: {
      statusCode: { type: 'integer', example: 403 },
      message: {
        type: 'string',
        example: 'Forbidden resource',
      },
      error: { type: 'string', example: 'Forbidden' },
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
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':id')
  @ApiOperation({
    summary: 'Add product to wishlist',
    tags: ['Wishlists Endpoints'],
    description:
      'This endpoint adds the product to the wishlist of the particular user',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiNotFoundResponse({
    description: 'Not found user or product with given id',
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
  @ApiConflictResponse({
    description: 'The product is already in the wishlist of the user',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: {
          type: 'string',
          example: Errors.PRODUCT_ALREADY_IN_WISHLIST,
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to add product to wishlist',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_ADD_PRODUCT_TO_WISHLIST,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'The ID of the wishlist owner' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
        },
      },

      required: ['productId'],
    },
  })
  async addToWishlist(
    @Param('id') userId: string,
    @Body('productId') productId: string,
  ): Promise<void> {
    await this.wishlistService.addToWishlist(userId, productId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove product from wishlist',
    tags: ['Wishlists Endpoints'],
    description:
      'This endpoint removes the product from the wishlist of the particular user',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiNotFoundResponse({
    description: 'Wishlist not found',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.WISHLIST_ENTRY_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to remove the product from wishlist',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_REMOVE_PRODUCT_FROM_WISHLIST,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'The ID of the wishlist owner' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
        },
      },

      required: ['productId'],
    },
  })
  async removeFromWishlist(
    @Param('id') userId: string,
    @Body('productId') productId: string,
  ): Promise<void> {
    await this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get products from the wishlist of the particular user',
    tags: ['Wishlists Endpoints'],
    description:
      'This endpoint returns the products from the wishlist of the particular user',
  })
  @ApiOkResponse({
    description: responseDescrptions.success,
    type: [Product],
  })
  @ApiNotFoundResponse({
    description: 'Wishlist not found',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.WISHLIST_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to get products from wishlist',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_RETRIEVE_WISHLIST,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'The ID of the wishlist owner' })
  async getWishlist(
    @Param('id') userId: string,
  ): Promise<ProductResponseDTO[]> {
    return this.wishlistService.getWishlist(userId);
  }
}
