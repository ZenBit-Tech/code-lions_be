import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  UseGuards,
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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { GetUserId } from 'src/common/decorators/get-user-id';
import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { Status } from 'src/modules/orders/entities/order-status.enum';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';

import { CreateNotificationDTO } from './dto/create-notification.dto';
import { NotificationResponseDTO } from './dto/notification-response.dto';
import { Type } from './entities/notification-type.enum';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BUYER, Role.VENDOR)
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
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a notification',
    tags: ['notifications'],
    description: 'This endpoint creates a new notification.',
  })
  @ApiOkResponse({
    description: 'The notification',
    type: CreateNotificationDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.INVALID_NOTIFICATION_REQUEST,
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create notification',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_CREATE_NOTIFICATION,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: CreateNotificationDTO })
  async createNotification(
    @GetUserId() currentUserId: string,
    @Body('type') type: Type,
    @Body('orderId') orderId?: number,
    @Body('userId') userId?: string,
    @Body('shippingStatus') shippingStatus?: Status,
  ): Promise<NotificationResponseDTO> {
    try {
      const finalUserId = userId || currentUserId;

      return await this.notificationService.createNotification(
        type,
        finalUserId,
        orderId,
        shippingStatus,
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get notifications by user ID',
    tags: ['notifications'],
    description: 'This endpoint returns a list of notifications by user ID.',
  })
  @ApiOkResponse({
    description: 'The list of notifications by user ID',
    type: [NotificationResponseDTO],
  })
  @ApiNotFoundResponse({
    description: 'Not found user with given id',
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
    description: 'Failed to fetch user`s notifications',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_NOTIFICATIONS,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async getNotificationsByUser(
    @GetUserId() userId: string,
  ): Promise<NotificationResponseDTO[]> {
    return await this.notificationService.getNotificationsByUser(userId);
  }
}
