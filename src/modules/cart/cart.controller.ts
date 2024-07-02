import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
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
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { UserIdGuard } from 'src/modules/users/user-id.guard';

import { CartService } from './cart.service';
import { ResponseCartItemDto } from './response-cart.dto';

@ApiTags('cart')
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
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post(':id')
  @ApiOperation({
    summary: 'Add product to cart',
    tags: ['Cart Endpoints'],
    description:
      'This endpoint adds a product to the cart of the particular user',
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
    description: 'The product is already in the cart of the user',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: {
          type: 'string',
          example: Errors.PRODUCT_ALREADY_IN_CART,
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to add product to cart',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_ADD_PRODUCT_TO_CART,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'The ID of the cart owner' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        duration: { type: 'number' },
      },
      required: ['productId', 'duration'],
    },
  })
  async addToCart(
    @Param('id') userId: string,
    @Body('productId') productId: string,
    @Body('duration') duration: number,
  ): Promise<void> {
    return this.cartService.addToCart(userId, productId, duration);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove product from cart',
    tags: ['Cart Endpoints'],
    description:
      'This endpoint removes a product from the cart of the particular user',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiNotFoundResponse({
    description: 'Cart entry not found',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.CART_ENTRY_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to remove product from cart',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_REMOVE_PRODUCT_FROM_CART,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'The ID of the cart owner' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
      },
      required: ['productId'],
    },
  })
  async removeFromCart(
    @Param('id') userId: string,
    @Body('productId') productId: string,
  ): Promise<void> {
    return this.cartService.removeFromCart(userId, productId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get products from the cart of the particular user',
    tags: ['Cart Endpoints'],
    description:
      'This endpoint returns the products from the cart of the particular user',
  })
  @ApiOkResponse({
    description: responseDescrptions.success,
    type: [ResponseCartItemDto],
  })
  @ApiNotFoundResponse({
    description: 'Cart not found',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.CART_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve cart',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_RETRIEVE_CART,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'The ID of the cart owner' })
  async getCart(@Param('id') userId: string): Promise<ResponseCartItemDto[]> {
    return this.cartService.getCart(userId);
  }
}
