import { Body, Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDTO } from './DTO/create.dto';
import { ResponseUserDTO } from './DTO/response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.', type: [User] })
  async getUsers(): Promise<User[]> {
    return await this.usersService.getAllUsers();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: User,
  })
  async register(@Body() dto: CreateUserDTO): Promise<ResponseUserDTO> {
    return await this.usersService.registerUser(dto);
  }

  @Delete()
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUser(id);
  }
}
