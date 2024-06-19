import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ErrorResponse } from 'src/common/error-response';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { GeoNamesService } from 'src/modules/geoNames/geoNames.service';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';

@ApiTags('geoNames')
@Controller('geoNames')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiInternalServerErrorResponse({
  description: 'Internal server error',
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
export class GeoNamesController {
  constructor(private readonly geoNamesService: GeoNamesService) {}

  @Get('cities/:state')
  @ApiOperation({ summary: 'Get cities by state' })
  @ApiOkResponse({ description: 'List of cities', type: [String] })
  @ApiNotFoundResponse({
    description: 'State not found',
    type: ErrorResponse,
  })
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async getCitiesByState(@Param('state') stateName: string): Promise<string[]> {
    const adminCode =
      await this.geoNamesService.getAdminCodeByStateName(stateName);

    if (!adminCode) {
      throw new NotFoundException('State not found');
    }

    return this.geoNamesService.getCitiesByState(adminCode);
  }

  @Get('states/canada')
  @ApiOperation({ summary: 'Get all states in Canada' })
  @ApiOkResponse({ description: 'List of states', type: [String] })
  @ApiNotFoundResponse({
    description: 'States not found',
    type: ErrorResponse,
  })
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async getAllStatesInCanada(): Promise<{ name: string; adminCode: string }[]> {
    return await this.geoNamesService.getAllStatesInCanada();
  }
}
