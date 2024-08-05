import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

import { Errors } from 'src/common/errors';

import { BestVendorsResponseDto } from './dto/get-best-vendors.dto';
import { UsersService } from './users.service';

@ApiTags('best-vendors')
@Controller('best-vendors')
export class BestVendorsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Fetches best vendors',
    description: 'This endpoint allows to get top-rated vendors.',
  })
  @ApiOkResponse({
    description: 'The best-vendors have been successfully fetched.',
    type: [BestVendorsResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch best vendors',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_BEST_VENDORS,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
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
  async getBestVendors(
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('color') color?: string,
    @Query('style') style?: string,
    @Query('size') size?: string,
  ): Promise<BestVendorsResponseDto[]> {
    return await this.usersService.getBestVendors({
      minPrice,
      maxPrice,
      color,
      style,
      size,
    });
  }
}
