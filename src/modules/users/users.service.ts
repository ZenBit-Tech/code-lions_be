import {
  HttpException,
  HttpStatus,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDTO } from './DTO/create.dto';
import { ResponseUserDTO } from './DTO/response.dto';
import { Errors } from 'src/common/errors';

@Injectable()
export class UsersService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = +this.configService.get('SALT');
    return await bcrypt.hash(password, salt);
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      return this.entityManager.findOne(User, {
        where: { email },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch the user by email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async returnPublicUser(userObject: User): Promise<ResponseUserDTO> {
    const { id, name, email, isVerified } = userObject;

    const returnUser = { id, name, email, isVerified };
    return returnUser;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.entityManager
        .createQueryBuilder(User, 'user')
        .getMany();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async registerUser(dto: CreateUserDTO): Promise<ResponseUserDTO> {
    try {
      const userExists = await this.findUserByEmail(dto.email);
      if (userExists) {
        throw new BadRequestException(Errors.USER_EXISTS);
      }

      dto.password = await this.hashPassword(dto.password);

      const user = new User();
      user.name = dto.name;
      user.email = dto.email;
      user.password = dto.password;

      await this.entityManager.save(user);

      const responseUser = await this.returnPublicUser(user);
      return responseUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new HttpException(
          'Failed to create a user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async deleteUser(userId: string): Promise<string> {
    try {
      await this.entityManager.delete(User, userId);
      return 'The user is successfully deleted';
    } catch (error) {
      throw new HttpException(
        'Failed to delete a user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
