import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Errors } from 'src/common/errors';
import { VERIFICATION_CODE_LENGTH } from 'src/config';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { CreateUserDto } from 'src/modules/users/dto/create.dto';
import { PublicUserDto } from 'src/modules/users/dto/public-user.dto';
import { UsersService } from 'src/modules/users/users.service';

import { TokensDto } from './dto/tokens.dto';
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

  private async generateTokens(id: string, email: string): Promise<TokensDto> {
    const payload = { id, email };
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
  async register(dto: CreateUserDto): Promise<PublicUserDto> {
    try {
      const user = await this.usersService.registerUser(dto);
      const otp = this.generateOtp(VERIFICATION_CODE_LENGTH);
      const isMailSent = await this.mailerService.sendMail({
        receiverEmail: user.email,
        subject: 'Verification email',
        templateName: 'verify-email.hbs',
        context: {
          name: user.name,
          otp: otp,
        },
      });

      if (!isMailSent) {
        await this.usersService.deleteUser(user.id);
        throw new ServiceUnavailableException(
          Errors.FAILED_TO_SEND_VERIFICATION_EMAIL,
        );
      }

      await this.usersService.saveOtp(user.id, otp);

      return user;
    } catch (error) {
      throw error;
    }
  }
  async verifyOtp(dto: VerifyOtpDto): Promise<TokensDto> {
    const { id, otp } = dto;
    const user = await this.usersService.getUserById(id);

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    if (user.otp !== otp || user.otpExpiration < new Date()) {
      throw new UnprocessableEntityException(Errors.WRONG_CODE);
    }

    await this.usersService.confirmUser(id);

    const tokens = await this.generateTokens(user.id, user.email);

    return tokens;
  }
}
