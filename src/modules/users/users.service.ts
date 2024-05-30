import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Errors } from 'src/common/errors';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create.dto';
import { ResponseUserDto } from './dto/response.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) { }

  async hashPassword(password: string): Promise<string> {
    const salt = +this.configService.get('SALT');

    return await bcrypt.hash(password, salt);
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      return this.userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch the user by email',
      );
    }
  }

  async returnPublicUser(userObject: User): Promise<ResponseUserDto> {
    const { id, name, email, isVerified } = userObject;

    const returnUser = { id, name, email, isVerified };

    return returnUser;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async registerUser(dto: CreateUserDto): Promise<ResponseUserDto> {
    try {
      const userExists = await this.findUserByEmail(dto.email);

      if (userExists) {
        throw new ConflictException(Errors.USER_EXISTS);
      }

      dto.password = await this.hashPassword(dto.password);

      const user = new User();

      user.name = dto.name;
      user.email = dto.email;
      user.password = dto.password;

      await this.userRepository.save(user);

      const responseUser = await this.returnPublicUser(user);

      return responseUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to create a user');
      }
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.userRepository.delete(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to delete a user');
      }
    }
  }
}
