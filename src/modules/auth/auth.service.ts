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
import { PublicUserDto } from 'src/modules/users/dto/public-user.dto';
import { UsersService } from 'src/modules/users/users.service';

import { LoginDto } from './dto/login.dto';
import { UserWithTokensDto } from './dto/user-with-tokens.dto';
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

  private async sendVerificationOtp(user: PublicUserDto): Promise<void> {
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

  async generateUserWithTokens(
    publicUser: PublicUserDto,
  ): Promise<UserWithTokensDto> {
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

  async login(dto: LoginDto): Promise<PublicUserDto> {
    const { email, password } = dto;
    const user = await this.usersService.getUserByEmail(email);

    if (!user) {
      throw new BadRequestException(Errors.INVALID_CREDENTIALS);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new BadRequestException(Errors.INVALID_CREDENTIALS);
    }

    return this.usersService.buildPublicUser(user);
  }

  async register(dto: CreateUserDto): Promise<PublicUserDto> {
    const user = await this.usersService.registerUser(dto);

    await this.sendVerificationOtp(user);

    return user;
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<UserWithTokensDto> {
    const { id, otp } = dto;
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

    const publicUser = this.usersService.buildPublicUser(user);
    const userWithTokens = await this.generateUserWithTokens(publicUser);

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
}
