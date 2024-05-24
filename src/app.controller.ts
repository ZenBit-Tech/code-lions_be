import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { User } from './common/entities/user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('users')
  async getUsers(): Promise<User[]> {
    try {
      return await this.appService.findAllUsers();
    } catch (error) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('users')
  async addUser(
    @Body('name') name: string,
    @Body('email') email: string,
  ): Promise<User> {
    try {
      return await this.appService.createUser(name, email);
    } catch (error) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
