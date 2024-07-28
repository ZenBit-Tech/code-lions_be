import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Errors } from 'src/common/errors';
import { ResponseCartItemDto } from 'src/modules/cart/response-cart.dto';
import { OrdersService } from 'src/modules/orders/orders.service';

import { CreateBuyerOrderDTO } from './dto/create-buyer-order.dto';
import { CreateOrderDTO } from './dto/create-order.dto';
import { OrderResponseDTO } from './dto/order-response.dto';

@ApiTags('orders')
@Controller('orders')
@ApiInternalServerErrorResponse({
  description: 'Internal server error',
})
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all orders',
    tags: ['Orders Endpoints'],
    description: 'This endpoint returns a list of orders.',
  })
  @ApiOkResponse({
    description: 'The list of orders',
    type: [OrderResponseDTO],
  })
  async findAll(): Promise<OrderResponseDTO[]> {
    return this.ordersService.findAll();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new order',
    tags: ['Order Endpoints'],
    description: 'This endpoint creates a new order.',
  })
  @ApiOkResponse({
    description: 'The order has been successfully created',
    type: OrderResponseDTO,
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
  async createOrder(
    @Body() createOrderDTO: CreateOrderDTO,
  ): Promise<OrderResponseDTO> {
    return this.ordersService.createOrder(createOrderDTO);
  }

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

  @Post('create-order')
  @ApiOperation({
    summary: 'Create a buyer order',
    tags: ['Order Endpoints'],
    description: 'This endpoint creates a new buyer order.',
  })
  @ApiOkResponse({
    description: 'The buyer order has been successfully created',
    type: [CreateBuyerOrderDTO],
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
    description: 'Failed to create buyer order',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_CREATE_BUYER_ORDER,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({
    type: [ResponseCartItemDto],
  })
  async createBuyerOrder(
    @Body() responseCartItemDto: ResponseCartItemDto[],
  ): Promise<CreateBuyerOrderDTO> {
    return this.ordersService.createBuyerOrder(responseCartItemDto);
  }
}
