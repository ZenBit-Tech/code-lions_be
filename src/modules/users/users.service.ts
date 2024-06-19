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
import { UpdateUserProfileByAdminDto } from './dto/update-user-profile-admin.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
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

  async updateUserRole(id: string, role: Role): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      await this.userRepository.update(id, { role });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_ROLE);
    }
  }

  async updateUserPhoneNumber(id: string, phoneNumber: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      await this.userRepository.update(id, { phoneNumber });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_UPDATE_PHONE_NUMBER,
      );
    }
  }

  async updateUserProfile(
    id: string,
    updateProfileDto: UpdateUserProfileDto,
  ): Promise<User> {
    try {
      const user = await this.getUserById(id);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const {
        name,
        email,
        phoneNumber,
        clothesSize,
        jeansSize,
        shoesSize,
        addressLine1,
        addressLine2,
        country,
        state,
        city,
        cardNumber,
        expireDate,
        cvvCode,
      } = updateProfileDto;

      if (name) user.name = name;
      if (email) user.email = email;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (clothesSize) user.clothesSize = clothesSize;
      if (jeansSize) user.jeansSize = jeansSize;
      if (shoesSize) user.shoesSize = shoesSize;
      if (addressLine1) user.addressLine1 = addressLine1;
      if (addressLine2) user.addressLine2 = addressLine2;
      if (country) user.country = country;
      if (state) user.state = state;
      if (city) user.city = city;
      if (cardNumber) user.cardNumber = cardNumber;
      if (expireDate) user.expireDate = expireDate;
      if (cvvCode) user.cvvCode = cvvCode;

      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_PROFILE);
    }
  }

  async updateUserProfileByAdmin(
    id: string,
    updateProfileByAdminDto: UpdateUserProfileByAdminDto,
  ): Promise<User> {
    try {
      const user = await this.getUserById(id);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const {
        name,
        phoneNumber,
        addressLine1,
        addressLine2,
        country,
        state,
        city,
        isAccountActive,
      } = updateProfileByAdminDto;

      if (name) user.name = name;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (addressLine1) user.addressLine1 = addressLine1;
      if (addressLine2) user.addressLine2 = addressLine2;
      if (country) user.country = country;
      if (state) user.state = state;
      if (city) user.city = city;
      if (user.isAccountActive !== isAccountActive) {
        user.isAccountActive = isAccountActive;
      }

      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_PROFILE);
    }
  }
}
