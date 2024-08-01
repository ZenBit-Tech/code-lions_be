import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Post,
  UseGuards,
  InternalServerErrorException,
  Req,
  Request,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { OrdersService } from 'src/modules/orders/orders.service';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';

import { UserResponseDto } from '../auth/dto/user-response.dto';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDTO } from './dto/order-response.dto';
import { SingleOrderResponse } from './dto/single-order-response.dto';

@ApiTags('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BUYER, Role.VENDOR, Role.ADMIN)
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
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('vendor/:id')
  @ApiOperation({
    summary: 'Get orders by vendor ID',
    tags: ['Order Endpoints'],
    description: 'This endpoint returns a list of orders by vendor ID.',
  })
  @ApiOkResponse({
    description: 'The list of orders by vendor ID',
    type: [OrderResponseDTO],
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
    description: 'Failed to fetch orders by vendor',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_ORDERS_BY_VENDOR,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async findByVendorId(
    @Param('id') vendorId: string,
  ): Promise<OrderResponseDTO[]> {
    return this.ordersService.findByVendor(vendorId);
  }

  @Post('pay')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a buyer order',
    tags: ['Order Endpoints'],
    description: 'This endpoint creates a new buyer order.',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.INVALID_ORDER_REQUEST,
        },
        error: { type: 'string', example: 'Bad Request' },
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
          example: Errors.FAILED_TO_PAY_FOR_ORDER,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: CreateOrderDto })
  async createOrdersForUser(
    @Req() req: any,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<void> {
    const userId = req.user.id;
    const { shippingPrice } = createOrderDto;

    try {
      await this.ordersService.createOrdersForUser(userId, shippingPrice);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  @Get(':userId/:orderId')
  async getOrderByUserIdAndOrderId(
    @Param('userId') userId: string,
    @Param('orderId') orderId: number,
  ): Promise<SingleOrderResponse> {
    return await this.ordersService.findByUserIdAndOrderId(userId, orderId);
  }

  @Patch(':orderId')
  async rejectOrder(
    @Request() request: Request & { user: UserResponseDto },
    @Param('orderId') orderId: number,
  ): Promise<void> {
    const vendorId = request.user.id;

    return await this.ordersService.rejectOrder(vendorId, orderId);
  }
}
