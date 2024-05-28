import { Body, Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import {
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateUserDTO } from './DTO/create.dto';
import { ResponseUserDTO } from './DTO/response.dto';
import { ErrorResponse } from 'src/common/ErrorResponse';
import { responseDescrptions } from 'src/common/responseDescriptions';

@ApiTags('users')
@Controller('users')
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
  @ApiInternalServerErrorResponse({
    description: responseDescrptions.error,
    type: ErrorResponse,
  })
  async getUsers(): Promise<User[]> {
    return await this.usersService.getAllUsers();
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
    type: ResponseUserDTO,
  })
  @ApiBadRequestResponse({
    description: responseDescrptions.error,
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: responseDescrptions.error,
    type: ErrorResponse,
  })
  @ApiBody({ type: CreateUserDTO })
  async register(@Body() dto: CreateUserDTO): Promise<ResponseUserDTO> {
    return await this.usersService.registerUser(dto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete a user',
    tags: ['Users Endpoints'],
    description: 'This endpoint deletes a user from the database.',
  })
  @ApiResponse({
    status: 204,
    description: responseDescrptions.success,
  })
  @ApiInternalServerErrorResponse({
    description: responseDescrptions.error,
    type: ErrorResponse,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to delete',
  })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUser(id);
  }
}
