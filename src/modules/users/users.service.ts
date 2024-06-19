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

import { UserResponseDto } from '../auth/dto/user-response.dto';
import { Role } from '../roles/role.enum';

import { GooglePayloadDto } from './../auth/dto/google-payload.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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

  buildUserResponseDto(user: User): UserResponseDto {
    const {
      id,
      name,
      email,
      role,
      isEmailVerified,
      photoUrl,
      phoneNumber,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      clothesSize,
      jeansSize,
      shoesSize,
      isAccountActive,
      isRoleFilled,
      isPhoneNumberFilled,
      isShippingAddressFilled,
      isCreditCardFilled,
      isSizeFilled,
      isOnboardingFilled,
    } = user;

    const publicUser: UserResponseDto = {
      id,
      name,
      email,
      role,
      isEmailVerified,
      photoUrl,
      phoneNumber,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      clothesSize,
      jeansSize,
      shoesSize,
      isAccountActive,
      isRoleFilled,
      isPhoneNumberFilled,
      isShippingAddressFilled,
      isCreditCardFilled,
      isSizeFilled,
      isOnboardingFilled,
    };

    return publicUser;
  }

  async getUserByEmail(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_FETCH_USER_BY_EMAIL,
      );
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      return user;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_USER_BY_ID);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.userRepository.find();

      return users;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_USERS);
    }
  }

  async registerUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { name, email, password } = createUserDto;

    try {
      const userExists = await this.getUserByEmail(email);

      if (userExists) {
        throw new ConflictException(Errors.USER_EXISTS);
      }

      const hashedPassword = await this.hashPassword(password);

      const user = new User();

      user.name = name;
      user.email = email;
      user.password = hashedPassword;

      const createdUser = await this.userRepository.save(user);

      const publicUser = this.buildUserResponseDto(createdUser);

      return publicUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else {
        throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_USER);
      }
    }
  }

  async registerUserViaGoogle(
    googlePayloadDto: GooglePayloadDto,
  ): Promise<UserResponseDto> {
    try {
      const password = await this.hashPassword(googlePayloadDto.sub);

      const user = new User();

      user.name = googlePayloadDto.givenName;
      user.email = googlePayloadDto.email;
      user.password = password;
      user.googleId = googlePayloadDto.sub;
      user.isEmailVerified = googlePayloadDto.isEmailVerified;

      const createdUser = await this.userRepository.save(user);

      const publicUser = this.buildUserResponseDto(createdUser);

      return publicUser;
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_CREATE_USER_VIA_GOOGLE,
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      await this.userRepository.delete(id);
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

  async saveOtp(id: string, otp: string): Promise<void> {
    try {
      const otpExpiration = new Date();

      otpExpiration.setSeconds(
        otpExpiration.getSeconds() + VERIFICATION_CODE_EXPIRATION,
      );

      await this.userRepository.update({ id }, { otp, otpExpiration });
    } catch (error) {
      throw new InternalServerErrorException(
        Errors.FAILED_TO_SAVE_VERIFICATION_CODE,
      );
    }
  }

  async confirmUser(id: string): Promise<void> {
    try {
      await this.userRepository.update(
        { id },
        { isEmailVerified: true, otp: null, otpExpiration: null },
      );
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_CONFIRM_USER);
    }
  }

  async changePassword(id: string, password: string): Promise<void> {
    try {
      const hashedPassword = await this.hashPassword(password);

      await this.userRepository.update({ id }, { password: hashedPassword });
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_CHANGE_PASSWORD);
    }
  }

  async updatePhotoUrl(id: string, photoUrl: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      await this.userRepository.update(id, { photoUrl });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_PHOTO_URL);
    }
  }

  async updateUserRole(id: string, role: Role): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      user.role = role;
      user.isRoleFilled = true;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_ROLE);
    }
  }

  async updateUserPhoneNumber(id: string, phoneNumber: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      user.phoneNumber = phoneNumber;
      user.isPhoneNumberFilled = true;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_UPDATE_PHONE_NUMBER,
      );
    }
  }

  async updateUserAddressLine1(
    id: string,
    addressLine1: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      await this.userRepository.update(id, { addressLine1 });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_UPDATE_ADDRESS_LINE,
      );
    }
  }

  async updateUserAddressLine2(
    id: string,
    addressLine2: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      await this.userRepository.update(id, { addressLine2 });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_UPDATE_ADDRESS_LINE,
      );
    }
  }

  async updateUserAddress(
    userId: string,
    addressLine1: string,
    addressLine2: string,
    state: string,
    city: string,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }
      user.addressLine1 = addressLine1;
      user.addressLine2 = addressLine2;
      user.state = state;
      user.city = city;
      user.isShippingAddressFilled = true;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_ADDRESS);
    }
  }
}
