import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcryptjs';
import { Errors } from 'src/common/errors';
import { LIMIT_USERS_PER_PAGE, VERIFICATION_CODE_EXPIRATION } from 'src/config';
import { RoleForUser } from 'src/modules/roles/role-user.enum';
import { Role } from 'src/modules/roles/role.enum';
import { Repository, Like, FindOptionsWhere } from 'typeorm';

import { UserResponseDto } from '../auth/dto/user-response.dto';
import { MailerService } from '../mailer/mailer.service';

import { GooglePayloadDto } from './../auth/dto/google-payload.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PersonalInfoDto } from './dto/personal-info.dto';
import { UpdateUserProfileByAdminDto } from './dto/update-user-profile-admin.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserCardDto } from './dto/user-card.dto';
import { OnboardingSteps } from './onboarding-steps.enum';
import { Order } from './order.enum';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private mailerService: MailerService,
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
      onboardingSteps,
      createdAt,
      lastUpdatedAt,
      deletedAt,
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
      onboardingSteps,
      createdAt,
      lastUpdatedAt,
      deletedAt,
    };

    return publicUser;
  }

  buildPersonalInfoResponseDto(user: User): PersonalInfoDto {
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
      onboardingSteps,
      createdAt,
      lastUpdatedAt,
      deletedAt,
      cardNumber,
      expireDate,
      cvvCode,
    } = user;

    const personalInfo: PersonalInfoDto = {
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
      onboardingSteps,
      createdAt,
      lastUpdatedAt,
      deletedAt,
      cardNumber,
      expireDate,
      cvvCode,
    };

    return personalInfo;
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

  async getUserByEmailWithDeleted(email: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        withDeleted: true,
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

  async getPublicUserById(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_DOES_NOT_EXIST);
      }

      const publicUserById = this.buildUserResponseDto(user);

      return publicUserById;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_USER_BY_ID);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.userRepository.find({ withDeleted: true });

      return users;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_USERS);
    }
  }

  private buildWhereCondition(
    search?: string,
    role?: Role,
  ): FindOptionsWhere<User>[] {
    let whereCondition: FindOptionsWhere<User>[] = [{}];

    if (role) {
      whereCondition = whereCondition.map((condition) => ({
        ...condition,
        role,
      }));
    }

    if (search) {
      whereCondition = [
        ...whereCondition.map((condition) => ({
          ...condition,
          name: Like(`%${search}%`),
        })),
        ...whereCondition.map((condition) => ({
          ...condition,
          email: Like(`%${search}%`),
        })),
      ];
    }

    return whereCondition;
  }

  private async fetchUsers(
    page: number,
    order: Order,
    whereCondition: FindOptionsWhere<User>[],
  ): Promise<{ users: UserResponseDto[]; pagesCount: number }> {
    try {
      const [users, totalCount] = await this.userRepository.findAndCount({
        where: whereCondition,
        order: {
          createdAt: order,
        },
        take: LIMIT_USERS_PER_PAGE,
        skip: (page - 1) * LIMIT_USERS_PER_PAGE,
      });

      const pagesCount = Math.ceil(totalCount / LIMIT_USERS_PER_PAGE);

      const publicUsers = users.map((user) => this.buildUserResponseDto(user));

      return { users: publicUsers, pagesCount };
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_USERS);
    }
  }

  async getUsersAdmin(
    page: number,
    order: Order,
    role?: Role,
    search?: string,
  ): Promise<{ users: UserResponseDto[]; pagesCount: number }> {
    try {
      const whereCondition = this.buildWhereCondition(search, role);

      return this.fetchUsers(page, order, whereCondition);
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
        withDeleted: true,
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

  async softDeleteUser(id: string): Promise<void> {
    try {
      const user = await this.getUserById(id);

      const deleteResponse = await this.userRepository.softDelete(id);

      if (!deleteResponse.affected) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const isMailSent = await this.mailerService.sendMail({
        receiverEmail: user.email,
        subject: 'Account deleted on CodeLions',
        templateName: 'soft-delete.hbs',
        context: {
          name: user.name,
        },
      });

      if (!isMailSent) {
        throw new ServiceUnavailableException(
          Errors.FAILED_TO_SEND_EMAIL_TO_DELETED_USER,
        );
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
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

  async updateUserRole(id: string, role: RoleForUser): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      user.role = role;
      user.onboardingSteps = OnboardingSteps.ROLE;
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
      user.onboardingSteps = OnboardingSteps.INFO;
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

  async updateUserAddress(
    userId: string,
    addressLine1: string,
    addressLine2: string,
    country: string,
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
      user.country = country;
      user.state = state;
      user.city = city;
      user.onboardingSteps = OnboardingSteps.ADDRESS;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_ADDRESS);
    }
  }

  async updateUserSize(
    userId: string,
    clothesSize: string,
    jeansSize: string,
    shoesSize: string,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }
      user.clothesSize = clothesSize;
      user.jeansSize = jeansSize;
      user.shoesSize = shoesSize;
      user.onboardingSteps = OnboardingSteps.SIZES;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_SIZE);
    }
  }

  async updateUserCreditCard(
    userId: string,
    cardNumber: string,
    expireDate: string,
    cvvCode: string,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }
      user.cardNumber = cardNumber;
      user.expireDate = expireDate;
      user.cvvCode = cvvCode;
      user.onboardingSteps = OnboardingSteps.CARD;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_CARD);
    }
  }

  async getUserCardDataById(id: string): Promise<UserCardDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(Errors.USER_DOES_NOT_EXIST);
      }

      const userCardData: UserCardDto = {
        cardNumber: user.cardNumber,
        expireDate: user.expireDate,
        cvvCode: user.cvvCode,
      };

      return userCardData;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_USER_BY_ID);
    }
  }

  async updateUserFields(
    user: User,
    updateDto: Partial<UpdateUserProfileDto>,
  ): Promise<User> {
    try {
      const updateDtoKeys = Object.keys(
        updateDto,
      ) as (keyof typeof updateDto)[];

      updateDtoKeys.forEach((key) => {
        const value = updateDto[key];

        if (value !== undefined) {
          (user[key as keyof User] as typeof value) = value;
        }
      });

      return user;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_PROFILE);
    }
  }

  async updateUserFieldsAdmin(
    user: User,
    updateDto: Partial<UpdateUserProfileByAdminDto>,
  ): Promise<User> {
    try {
      const updateDtoKeys = Object.keys(
        updateDto,
      ) as (keyof typeof updateDto)[];

      updateDtoKeys.forEach((key) => {
        const value = updateDto[key];

        if (value !== undefined) {
          (user[key as keyof User] as typeof value) = value;
        }
      });

      if (updateDto.isAccountActive === false) {
        const isMailSent = await this.mailerService.sendMail({
          receiverEmail: user.email,
          subject: 'Account suspended on CodeLions',
          templateName: 'suspend-account.hbs',
          context: {
            name: user.name,
          },
        });

        if (!isMailSent) {
          throw new ServiceUnavailableException(
            Errors.FAILED_TO_SEND_EMAIL_TO_SUSPENDED_USER,
          );
        }
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_PROFILE);
    }
  }

  async updateUserProfile(
    id: string,
    updateProfileDto: UpdateUserProfileDto,
  ): Promise<PersonalInfoDto> {
    try {
      const user = await this.getUserById(id);

      const updatedUser = await this.updateUserFields(user, updateProfileDto);
      const savedUser = await this.userRepository.save(updatedUser);
      const userPersonalInfo = this.buildPersonalInfoResponseDto(savedUser);

      return userPersonalInfo;
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
  ): Promise<UserResponseDto> {
    try {
      const user = await this.getUserById(id);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const updatedUser = await this.updateUserFieldsAdmin(
        user,
        updateProfileByAdminDto,
      );
      const savedUser = await this.userRepository.save(updatedUser);
      const publicUser = this.buildUserResponseDto(savedUser);

      return publicUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_UPDATE_PROFILE);
    }
  }
}
