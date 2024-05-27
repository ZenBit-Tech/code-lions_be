import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user.entity';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async findAllUsers(): Promise<User[]> {
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

  async createUser(name: string, email: string): Promise<User> {
    try {
      const user = new User();
      user.id = uuidv4();
      user.name = name;
      user.email = email;
      return await this.entityManager.save(user);
    } catch (error) {
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
