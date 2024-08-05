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
  HttpCode,
  HttpStatus,
  Query,
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
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import { ORDERS_ON_PAGE } from 'src/config';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';
import { OrdersService } from 'src/modules/orders/orders.service';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDTO } from './dto/order-response.dto';
import { OrdersAndCountResponseDTO } from './dto/orders-count-response.dto';
import { SingleOrderResponse } from './dto/single-order-response.dto';
import { Status } from './entities/order-status.enum';

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
    const { shippingPrice, totalAmount, isPaid, paymentId } = createOrderDto;

    try {
      await this.ordersService.createOrdersForUser(
        userId,
        shippingPrice,
        totalAmount,
        isPaid,
        paymentId,
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  @Get('vendor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({
    summary: 'Get orders of user',
    tags: ['Order Endpoints'],
    description: 'This endpoint returns a sorted list of user`s orders',
  })
  @ApiOkResponse({
    description: 'The list of orders',
    type: [OrderResponseDTO],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch orders',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_ORDERS,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Order`s status',
    schema: { type: 'string', default: Status.NEW_ORDER },
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
    description: 'Orders on a page limit',
    schema: { type: 'number', default: ORDERS_ON_PAGE },
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'The field for sorting',
    schema: { type: 'string', enum: ['orderId', 'price', 'createdAt'] },
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'The order for sorting',
    schema: { type: 'string', enum: ['ASC', 'DESC'] },
  })
  async findOrdersByVendor(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = ORDERS_ON_PAGE,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<OrdersAndCountResponseDTO> {
    const vendorId = req.user.id;

    return this.ordersService.findOrdersByVendor(
      vendorId,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @Get(':orderId')
  @ApiOperation({
    summary: 'Get order by user ID and order ID',
    tags: ['Order Endpoints'],
    description:
      'This endpoint returns an order with related data by vendor or buyer ID and order ID.',
  })
  @ApiOkResponse({
    description: 'The order  by vendor or buyer ID and order ID',
    type: SingleOrderResponse,
  })
  @ApiNotFoundResponse({
    description: 'Not found order with given user id and order id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.ORDER_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch order by user ID and order ID',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_ORDER,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({ name: 'orderId', description: 'The ID of the order' })
  async getOrderByUserIdAndOrderId(
    @Request() request: Request & { user: UserResponseDto },
    @Param('orderId') orderId: number,
  ): Promise<SingleOrderResponse> {
    const user = request.user;

    return await this.ordersService.findByUserIdAndOrderId(user, orderId);
  }

  @Patch(':orderId')
  @ApiOperation({
    summary: 'Reject the order by vendor',
    tags: ['Order Endpoints'],
    description: 'This endpoint changes status of the order to rejected.',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiNotFoundResponse({
    description: 'Not found order with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.ORDER_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to reject the order',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_REJECT_ORDER,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectOrder(
    @Request() request: Request & { user: UserResponseDto },
    @Param('orderId') orderId: number,
  ): Promise<void> {
    const vendorId = request.user.id;

    return await this.ordersService.rejectOrder(vendorId, orderId);
  }
}
