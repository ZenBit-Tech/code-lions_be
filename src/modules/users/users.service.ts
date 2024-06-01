import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcryptjs';
import { Errors } from 'src/common/errors';
import { VERIFICATION_CODE_EXPIRATION } from 'src/config';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create.dto';
import { PublicUserDto } from './dto/public-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  private buildPublicUserResponse(user: User): PublicUserDto {
    const { id, name, email, isVerified } = user;

    const publicUser = { id, name, email, isVerified };

    return publicUser;
  }
  private async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);

      return hash;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_HASH);
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      return this.userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_FETCH_USER_BY_EMAIL,
      );
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_USERS);
    }
  }

  async registerUser(dto: CreateUserDto): Promise<PublicUserDto> {
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

      const createdUser = await this.userRepository.save(user);

      const publicUser = this.buildPublicUserResponse(createdUser);

      return publicUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else {
        throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_USER);
      }
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      await this.userRepository.delete(userId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_DELETE_USER);
    }
  }

  async saveVerificationCode(userId: string, code: string): Promise<void> {
    try {
      const verificationCodeExpiration = new Date();

      verificationCodeExpiration.setSeconds(
        verificationCodeExpiration.getSeconds() + VERIFICATION_CODE_EXPIRATION,
      );

      await this.userRepository.update(
        { id: userId },
        { verificationCode: code, verificationCodeExpiration },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_SAVE_VERIFICATION_CODE,
      );
    }
  }
}
