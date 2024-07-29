import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { FollowDto } from './dto/follow-vendor.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':id/follow')
  @ApiOperation({
    summary: 'Updates the follow status of a vendor',
    description: 'This endpoint allows updating the follow status of a vendor.',
  })
  @ApiBody({
    description: 'Follow status of the vendor',
    type: FollowDto,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'The follow status has been successfully updated.',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'Not found vendor with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: 'Vendor with the given ID does not exist',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update follow status',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to update follow status',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  async updateFollowStatus(
    @Param('id') id: string,
    @Body() followDto: FollowDto,
  ): Promise<User> {
    const user = await this.usersService.updateFollowStatus(
      id,
      followDto.isFollowed,
    );

    return user;
  }
}
