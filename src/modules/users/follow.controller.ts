import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Errors } from 'src/common/errors';

import { JwtAuthGuard } from '../auth/auth.guard';
import { Role } from '../roles/role.enum';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';

import { FollowVendorDto } from './dto/follow.dto';
import { FollowService } from './follow.service';
import { User } from './user.entity';

@ApiTags('vendors')
@Controller('vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post('follow')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Follow a vendor' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The buyer has successfully followed the vendor.',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buyer or vendor ID.',
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
    description: 'Failed to follow vendor',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to follow vendor',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: FollowVendorDto })
  async followVendor(@Body() followDto: FollowVendorDto): Promise<User> {
    return await this.followService.followVendor(followDto);
  }

  @Delete('unfollow')
  @Roles(Role.BUYER)
  @ApiOperation({ summary: 'Unfollow a vendor' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'The buyer has successfully unfollowed the vendor.',
  })
  @ApiNotFoundResponse({
    description: 'Follow relationship not found.',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: 'Follow relationship not found',
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
    description: 'Failed to unfollow vendor',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to unfollow vendor',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: FollowVendorDto })
  async unfollowVendor(@Body() followDto: FollowVendorDto): Promise<void> {
    return await this.followService.unfollowVendor(followDto);
  }
}
