import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
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
  async getBestVendors(): Promise<BestVendorsResponseDto[]> {
    return await this.usersService.getBestVendors();
  }
}
