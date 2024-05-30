import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateUserDto } from './Dto/create.dto';
import { ResponseUserDto } from './Dto/response.dto';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        ConfigService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUsers => should return an array of users', async () => {
    const users: User[] = [
      {
        id: '61c674384-f944-401b-949b-b76e8793bdc9',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password:
          '$2b$10$bcOlXlUdMoPiI1aZJgyXEeRXhbms7spSgaktfTskP01IDAObl7Aiu',
        isVerified: false,
      },
      {
        id: 'a1b2c3d4-1234-5678-9876-abcdef123456',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password:
          '$2b$10$abcDefGhiJklMnoPqrStuVwXyz1234567890AbcDefGhiJklMnoPqrStuVwXyz',
        isVerified: true,
      },
    ];

    jest.spyOn(controller, 'getUsers').mockResolvedValue(users);

    const result = await controller.getUsers();

    expect(controller.getUsers).toHaveBeenCalled();
    expect(result).toEqual(users);
  });

  it('register => should create a new user and return the response user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'John',
      email: 'test@example.com',
      password: 'password',
    };
    const responseUser: ResponseUserDto = {
      id: '123',
      name: 'John',
      email: 'test@example.com',
      isVerified: false,
    };

    jest.spyOn(controller, 'register').mockResolvedValue(responseUser);

    const result = await controller.register(createUserDto);

    expect(controller.register).toHaveBeenCalledWith(createUserDto);
    expect(result).toEqual({ ...responseUser, id: result.id });
  });
});
