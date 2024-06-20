import { extname } from 'path';

import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ValidationPipe,
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
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { UpdateUserPhoneDto } from './dto/update-user-phone.dto';
import { UpdateUserProfileByAdminDto } from './dto/update-user-profile-admin.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
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
        users: {
          type: 'array',
          items: { $ref: getSchemaPath(UserResponseDto) },
        },
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
  ): Promise<{ users: UserResponseDto[]; pagesCount: number }> {
    return this.usersService.getUsersAdmin(page, order, role, search);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID (Admin panel)',
    tags: ['Users Endpoints'],
    description: 'This endpoint returns a public user by ID for admin panel',
  })
  @ApiOkResponse({
    description: 'The user has been successfully fetched.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Not found user with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.USER_BY_ID_DOES_NOT_EXIST,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to get user by ID from admin panel',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_FETCH_USER_BY_ID,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to fetch',
  })
  async getUserByIdAdmin(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.usersService.getPublicUserById(id);
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
  @Roles(Role.BUYER, Role.VENDOR)
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
  @Roles(Role.BUYER, Role.VENDOR)
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
  @Roles(Role.BUYER, Role.VENDOR)
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
  @Roles(Role.BUYER, Role.VENDOR)
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

  @Patch(':id/update-profile')
  @UseGuards(UserIdGuard)
  @Roles(Role.BUYER, Role.VENDOR)
  @ApiOperation({
    summary: 'Update user profile',
    tags: ['Users Endpoints'],
    description:
      'This endpoint allows buyers and vendors to update their profiles.',
  })
  @ApiOkResponse({
    description: 'The user has been successfully fetched.',
    type: UserResponseDto,
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
    description: 'Failed to update user profile',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: { type: 'string', example: Errors.FAILED_TO_UPDATE_PROFILE },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to update',
  })
  async updateUserProfile(
    @Request() req: Request,
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true,
        transform: true,
      }),
    )
    updateProfileDto: UpdateUserProfileDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.updateUserProfile(id, updateProfileDto);
  }

  @Patch(':id/update-profile-admin')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update user profile by admin',
    tags: ['Users Endpoints'],
    description:
      'This endpoint allows admin to update profiles of buyers and vendors.',
  })
  @ApiOkResponse({
    description: 'The user has been successfully fetched.',
    type: UserResponseDto,
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
    description: 'Failed to update user profile by admin',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: { type: 'string', example: Errors.FAILED_TO_UPDATE_PROFILE },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to update by admin',
  })
  async updateUserProfileByAdmin(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true,
        transform: true,
      }),
    )
    updateProfileByAdminDto: UpdateUserProfileByAdminDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.updateUserProfileByAdmin(
      id,
      updateProfileByAdminDto,
    );
  }
}
