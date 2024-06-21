import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';
import { Errors } from 'src/common/errors';
import { VERIFICATION_CODE_LENGTH } from 'src/config';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UsersService } from 'src/modules/users/users.service';

import { GooglePayloadDto } from './dto/google-payload.dto';
import { LoginDto } from './dto/login.dto';
import { ResetOtpDto } from './dto/reset-otp';
import { UserResponseDto } from './dto/user-response.dto';
import { UserWithTokensResponseDto } from './dto/user-with-tokens-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private usersService: UsersService,
  ) {}

  private generateOtp(length: number): string {
    const digits = '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return result;
  }

  private async sendVerificationOtp(user: UserResponseDto): Promise<void> {
    const otp = this.generateOtp(VERIFICATION_CODE_LENGTH);
    const isMailSent = await this.mailerService.sendMail({
      receiverEmail: user.email,
      subject: 'Verification on CodeLions otp',
      templateName: 'verify-email.hbs',
      context: {
        name: user.name,
        otp: otp,
      },
    });

    if (!isMailSent) {
      throw new ServiceUnavailableException(
        Errors.FAILED_TO_SEND_VERIFICATION_EMAIL,
      );
    }
    await this.usersService.saveOtp(user.id, otp);
  }

  private async sendResetPasswordOtp(user: UserResponseDto): Promise<void> {
    const otp = this.generateOtp(VERIFICATION_CODE_LENGTH);
    const isMailSent = await this.mailerService.sendMail({
      receiverEmail: user.email,
      subject: 'Forgot Password on CodeLions otp',
      templateName: 'forgot-password.hbs',
      context: {
        name: user.name,
        otp: otp,
      },
    });

    if (!isMailSent) {
      throw new ServiceUnavailableException(
        Errors.FAILED_TO_SEND_FORGET_PASSWORD_EMAIL,
      );
    }
    await this.usersService.saveOtp(user.id, otp);
  }

  private makeUserVerified(user: UserResponseDto): UserResponseDto {
    return {
      ...user,
      isEmailVerified: true,
    };
  }

  async generateUserWithTokensResponseDto(
    publicUser: UserResponseDto,
  ): Promise<UserWithTokensResponseDto> {
    const payload = { ...publicUser };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
      expiresIn: this.configService.get<string>('TOKEN_EXPIRE_TIME'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET_REFRESH_KEY'),
      expiresIn: this.configService.get<string>('TOKEN_REFRESH_EXPIRE_TIME'),
    });

    return {
      ...payload,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<UserResponseDto> {
    const { email, password } = loginDto;
    const user = await this.usersService.getUserByEmailWithDeleted(email);

    if (!user) {
      throw new BadRequestException(Errors.INVALID_CREDENTIALS);
    }

    if (user && user.deletedAt !== null) {
      throw new BadRequestException(Errors.ACCOUNT_DELETED_BY_ADMIN);
    }

    if (user && !user.isAccountActive) {
      throw new BadRequestException(Errors.ACCOUNT_SUSPENDED_BY_ADMIN);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new BadRequestException(Errors.INVALID_CREDENTIALS);
    }

    return this.usersService.buildUserResponseDto(user);
  }

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.registerUser(createUserDto);

    await this.sendVerificationOtp(user);

    return user;
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
  ): Promise<UserWithTokensResponseDto> {
    const { id, otp } = verifyOtpDto;
    const user = await this.usersService.getUserById(id);

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    if (user.otp !== otp || user.otpExpiration < new Date()) {
      throw new UnprocessableEntityException(Errors.WRONG_CODE);
    }

    await this.usersService.confirmUser(id);
    await this.mailerService.sendMail({
      receiverEmail: user.email,
      subject: 'Verification on CodeLions success',
      templateName: 'verification-success.hbs',
      context: {
        name: user.name,
      },
    });

    const publicUser = this.usersService.buildUserResponseDto(user);
    const verifiedUser = this.makeUserVerified(publicUser);
    const userWithTokens =
      await this.generateUserWithTokensResponseDto(verifiedUser);

    return userWithTokens;
  }

  async resendOtp(id: string): Promise<void> {
    const user = await this.usersService.getUserById(id);

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }
    if (user.isEmailVerified) {
      throw new BadRequestException(Errors.EMAIL_ALREADY_VERIFIED);
    }

    const otp = this.generateOtp(VERIFICATION_CODE_LENGTH);

    const isMailSent = await this.mailerService.sendMail({
      receiverEmail: user.email,
      subject: 'Your verification code on CodeLions',
      templateName: 'resend-otp.hbs',
      context: {
        name: user.name,
        otp: otp,
      },
    });

    if (!isMailSent) {
      throw new ServiceUnavailableException(
        Errors.FAILED_TO_SEND_VERIFICATION_EMAIL,
      );
    }

    await this.usersService.saveOtp(user.id, otp);
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    const user = await this.usersService.getUserByEmail(email);

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    await this.sendResetPasswordOtp(user);
  }

  async resetPassword(
    resetOtpDto: ResetOtpDto,
  ): Promise<UserWithTokensResponseDto> {
    const { email, otp } = resetOtpDto;

    const user = await this.usersService.getUserByEmail(email);

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    if (user.otp !== otp || user.otpExpiration < new Date()) {
      throw new UnprocessableEntityException(Errors.WRONG_CODE);
    }

    await this.usersService.confirmUser(user.id);

    const publicUser = this.usersService.buildUserResponseDto(user);
    const verifiedUser = this.makeUserVerified(publicUser);
    const userWithTokens =
      await this.generateUserWithTokensResponseDto(verifiedUser);

    return userWithTokens;
  }

  async changePassword(id: string, password: string): Promise<void> {
    await this.usersService.changePassword(id, password);
  }

  async refreshToken(refreshToken: string): Promise<UserWithTokensResponseDto> {
    try {
      const { id } = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET_REFRESH_KEY'),
      });
      const user = await this.usersService.getUserById(id);

      if (!user) {
        throw new Error();
      }

      const publicUser = this.usersService.buildUserResponseDto(user);
      const userWithTokens =
        await this.generateUserWithTokensResponseDto(publicUser);

      return userWithTokens;
    } catch (error) {
      throw new BadRequestException(Errors.INVALID_REFRESH_TOKEN);
    }
  }

  async authenticateViaGoogle(
    payload: GooglePayloadDto,
  ): Promise<UserResponseDto> {
    const email = payload.email;
    const user = await this.usersService.getUserByEmail(email);

    if (user) {
      const isGoogleIdValid = user.googleId === payload.sub;

      if (!isGoogleIdValid) {
        throw new BadRequestException(Errors.INVALID_GOOGLE_ID);
      }

      return this.usersService.buildUserResponseDto(user);
    } else {
      const newUser = await this.usersService.registerUserViaGoogle(payload);

      if (!newUser.isEmailVerified) {
        await this.sendVerificationOtp(newUser);
      }

      return newUser;
    }
  }
}
