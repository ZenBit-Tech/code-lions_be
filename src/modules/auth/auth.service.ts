import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Errors } from 'src/common/errors';
import { VERIFICATION_CODE_LENGTH } from 'src/config';
import { UsersService } from 'src/modules/users/users.service';

import { MailerService } from '../mailer/mailer.service';
import { CreateUserDto } from '../users/dto/create.dto';
import { PublicUserDto } from '../users/dto/public-user.dto';

import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailerService: MailerService,
  ) {}

  private generateOtp(length: number): string {
    const digits = '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return result;
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
  async verifyOtp(dto: VerifyOtpDto): Promise<void> {
    const { id, otp } = dto;
    const user = await this.usersService.getUserById(id);

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    if (user.otp !== otp || user.otpExpiration < new Date()) {
      throw new UnprocessableEntityException(Errors.WRONG_CODE);
    }

    await this.usersService.confirmUser(id);
  }
}
