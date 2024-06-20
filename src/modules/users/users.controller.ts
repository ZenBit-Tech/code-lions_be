import { extname } from 'path';

import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
  ApiQuery,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';

import { diskStorage } from 'multer';
import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import { RANDOM_NUMBER_MAX } from 'src/config';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserAddressLine1Dto } from './dto/update-user-address-line1.dto';
import { UpdateUserAddressLine2Dto } from './dto/update-user-address-line2.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { UpdateUserPhoneDto } from './dto/update-user-phone.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Order } from './order.enum';
import { UserIdGuard } from './user-id.guard';
import { User } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    tags: ['Users Endpoints'],
    description: 'This endpoint returns a list of users.',
  })
  @ApiOkResponse({
    description: responseDescrptions.success,
    type: [User],
  })
  @Roles(Role.ADMIN)
  async getUsers(): Promise<User[]> {
    return await this.usersService.getAllUsers();
  }

  @Get('admin-id')
  @ApiOperation({
    summary: 'Get admin ID',
    tags: ['Users Endpoints'],
    description: 'This endpoint returns the ID of the admin user.',
  })
  @ApiOkResponse({
    description: responseDescrptions.success,
    type: String,
  })
  @Roles(Role.ADMIN)
  async getAdminId(): Promise<string> {
    return this.usersService.getAdminId();
  }

  @Get('admin')
  @ApiOperation({
    summary:
      'Get users from admin panel with pagination, filtering, and sorting',
    tags: ['Users Endpoints'],
    description:
      'This endpoint returns a paginated list of users with optional filtering by role and search term, and sorting by creation date.',
  })
  @ApiOkResponse({
    description: responseDescrptions.success,
    schema: {
      properties: {
        users: { type: 'array', items: { $ref: getSchemaPath(User) } },
        pagesCount: { type: 'number', example: 1 },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    schema: { type: 'number', default: 1 },
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort order for the results',
    example: Order.ASC,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Role to filter users by',
    example: Role.BUYER,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter users by name or email',
    schema: { type: 'string' },
  })
  @Roles(Role.ADMIN)
  async getUsersAdmin(
    @Query('page') page: number = 1,
    @Query('order') order: Order = Order.DESC,
    @Query('role') role?: Role,
    @Query('search') search?: string,
  ): Promise<{ users: User[]; pagesCount: number }> {
    return this.usersService.getUsersAdmin(page, order, role, search);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    tags: ['Users Endpoints'],
    description:
      'This endpoint creates a new user in the database and returns an object with the new user.',
  })
  @ApiResponse({
    status: 201,
    description: responseDescrptions.success,
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: responseDescrptions.error,
    type: ErrorResponse,
  })
  @ApiBody({ type: CreateUserDto })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.registerUser(createUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a user',
    tags: ['Users Endpoints'],
    description: 'This endpoint deletes a user from the database.',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiNotFoundResponse({
    description: responseDescrptions.error,
    type: ErrorResponse,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to delete',
  })
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUser(id);
  }

  @Delete(':id/soft-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete a user',
    tags: ['Users Endpoints'],
    description: 'This endpoint softly deletes a user.',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
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
  @ApiServiceUnavailableResponse({
    description: 'Service is unavailable',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 503 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SEND_EMAIL_TO_DELETED_USER,
        },
        error: { type: 'string', example: 'Service Unavailable' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to soft delete',
  })
  @Roles(Role.ADMIN)
  async softDeleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.softDeleteUser(id);
  }

  @Post(':id/photo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserIdGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Upload a user photo',
    tags: ['Users Endpoints'],
    description:
      'This endpoint uploads a photo for a user and updates the photo URL in the database.',
  })
  @ApiNoContentResponse({
    status: 204,
    description: 'Photo uploaded successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file or request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPDATE_PHOTO_URL,
        },
        error: { type: 'string', example: 'Bad Request' },
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
    description: 'Failed to upload photo',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.INTERNAL_SERVER_ERROR,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * RANDOM_NUMBER_MAX);
          const ext = extname(file.originalname);

          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const photoUrl = `./uploads/avatars/${file.filename}`;

    await this.usersService.updatePhotoUrl(id, photoUrl);

    return {
      url: photoUrl,
    };
  }

  @Post(':id/role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update user role',
    tags: ['Users Endpoints'],
    description: 'This endpoint updates the role of a user.',
  })
  @ApiResponse({
    status: 201,
    description: responseDescrptions.success,
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: { type: 'string', example: Errors.INCORRECT_ROLE },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: Errors.INVALID_TOKEN },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update role',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: { type: 'string', example: Errors.FAILED_TO_UPDATE_ROLE },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: UpdateUserRoleDto })
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Body('onboardingSteps') onboardingSteps: string,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateUserRole(
      id,
      updateUserRoleDto.role,
      onboardingSteps,
    );

    return this.usersService.buildUserResponseDto(updatedUser);
  }

  @Post(':id/phone')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update user phone number',
    tags: ['Users Endpoints'],
    description: 'This endpoint updates the phone number of a user.',
  })
  @ApiResponse({
    status: 201,
    description: responseDescrptions.success,
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: { type: 'string', example: Errors.INCORRECT_PHONE },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: Errors.INVALID_TOKEN },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update phone number',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: { type: 'string', example: Errors.FAILED_TO_CHANGE_PHOTO },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: UpdateUserPhoneDto })
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async updateUserPhoneNumber(
    @Param('id') id: string,
    @Body() updateUserPhoneDto: UpdateUserPhoneDto,
    @Body('onboardingSteps') onboardingSteps: string,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateUserPhoneNumber(
      id,
      updateUserPhoneDto.phoneNumber,
      onboardingSteps,
    );

    return this.usersService.buildUserResponseDto(updatedUser);
  }

  @Post(':id/address-line1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update user address line 1',
    tags: ['Users Endpoints'],
    description: 'This endpoint updates the address line 1 of a user.',
  })
  @ApiNoContentResponse({
    status: 204,
    description: 'Address line 1 updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: { type: 'string', example: Errors.INCORRECT_ADDRESS_LINE1 },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: Errors.INVALID_TOKEN },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update address line 1',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPDATE_ADDRESS_LINE1,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: UpdateUserAddressLine1Dto })
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async updateUserAddressLine1(
    @Param('id') id: string,
    @Body() updateUserAddressLine1Dto: UpdateUserAddressLine1Dto,
  ): Promise<void> {
    await this.usersService.updateUserAddressLine1(
      id,
      updateUserAddressLine1Dto.addressLine1,
    );
  }

  @Post(':id/address-line2')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update user address line 2',
    tags: ['Users Endpoints'],
    description: 'This endpoint updates the address line 2 of a user.',
  })
  @ApiNoContentResponse({
    status: 204,
    description: 'Address line 2 updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: { type: 'string', example: Errors.INCORRECT_ADDRESS_LINE2 },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: Errors.INVALID_TOKEN },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update address line 2',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPDATE_ADDRESS_LINE2,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: UpdateUserAddressLine2Dto })
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async updateUserAddressLine2(
    @Param('id') id: string,
    @Body() updateUserAddressLine2Dto: UpdateUserAddressLine2Dto,
  ): Promise<void> {
    await this.usersService.updateUserAddressLine2(
      id,
      updateUserAddressLine2Dto.addressLine2,
    );
  }

  @Post(':id/address')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update user address',
    tags: ['Users Endpoints'],
    description: 'This endpoint updates the address information of a user.',
  })
  @ApiNoContentResponse({
    status: 204,
    description: 'Address updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: { type: 'string', example: Errors.INCORRECT_ADDRESS },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: Errors.INVALID_TOKEN },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update address',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_UPDATE_ADDRESS,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: UpdateUserAddressDto })
  @Roles(Role.ADMIN, Role.BUYER, Role.VENDOR)
  async updateUserAddress(
    @Param('id') id: string,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
    @Body('onboardingSteps') onboardingSteps: string,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateUserAddress(
      id,
      updateUserAddressDto.addressLine1,
      updateUserAddressDto.addressLine2,
      updateUserAddressDto.state,
      updateUserAddressDto.city,
      onboardingSteps,
    );

    return this.usersService.buildUserResponseDto(updatedUser);
  }
}
