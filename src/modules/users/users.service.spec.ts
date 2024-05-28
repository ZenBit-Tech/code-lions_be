import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDTO } from './DTO/create.dto';
import { ResponseUserDTO } from './DTO/response.dto';
import { HttpException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        EntityManager,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash the password', async () => {
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);

      const shouldPasswordsMatch = await bcrypt.compare(
        password,
        hashedPassword,
      );
      expect(shouldPasswordsMatch).toBe(true);
    });
  });

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const user = new User();
      user.email = email;

      jest.spyOn(entityManager, 'findOne').mockResolvedValue(user);

      const result = await service.findUserByEmail(email);

      expect(entityManager.findOne).toHaveBeenCalledWith(User, {
        where: { email },
      });
      expect(result).toEqual(user);
    });
  });

  describe('returnPublicUser', () => {
    it('should return a public user object', async () => {
      const user = new User();
      user.id = '123';
      user.name = 'John Doe';
      user.email = 'test@example.com';
      user.isVerified = true;

      const expectedResult: ResponseUserDTO = {
        id: '123',
        name: 'John Doe',
        email: 'test@example.com',
        isVerified: true,
      };

      const result = await service.returnPublicUser(user);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [new User(), new User()];

      jest.spyOn(entityManager, 'createQueryBuilder').mockReturnValue({
        getMany: jest.fn().mockResolvedValue(users),
      } as any);

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(entityManager.createQueryBuilder).toHaveBeenCalledWith(
        User,
        'user',
      );
    });
  });

  describe('registerUser', () => {
    it('should register a new user when the user does not already exist', async () => {
      const dto: CreateUserDTO = {
        name: 'John',
        email: 'test@example.com',
        password: 'password',
      };

      jest.spyOn(service, 'findUserByEmail').mockResolvedValue(null);

      const user = new User();
      user.name = dto.name;
      user.email = dto.email;
      user.password = dto.password;

      jest.spyOn(service, 'hashPassword').mockResolvedValue(dto.password);
      jest.spyOn(entityManager, 'save').mockResolvedValue(user);
      jest.spyOn(service, 'returnPublicUser').mockResolvedValue(user);

      const result = await service.registerUser(dto);

      expect(service.findUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(service.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(entityManager.save).toHaveBeenCalledWith(user);
      expect(service.returnPublicUser).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });

    it('should throw an error if the user already exists', async () => {
      const dto: CreateUserDTO = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
      };

      const existingUser = new User();
      jest.spyOn(service, 'findUserByEmail').mockResolvedValue(existingUser);

      await expect(service.registerUser(dto)).rejects.toThrow(HttpException);

      expect(service.findUserByEmail).toHaveBeenCalledWith(dto.email);
    });
  });
});
