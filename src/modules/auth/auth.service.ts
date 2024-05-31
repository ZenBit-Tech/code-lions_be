import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { Errors } from 'src/common/errors';
import { VERIFICATION_CODE_LENGTH } from 'src/config';
import { UsersService } from 'src/modules/users/users.service';

import { MailerService } from '../mailer/mailer.service';
import { CreateUserDto } from '../users/dto/create.dto';
import { PublicUserDto } from '../users/dto/public-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private mailerService: MailerService,
  ) {}

  async register(dto: CreateUserDto): Promise<PublicUserDto> {
    try {
      const user = await this.usersService.registerUser(dto);
      const verificationCode = this.generateVerificationCode(
        VERIFICATION_CODE_LENGTH,
      );
      const isMailSent = await this.mailerService.sendMail({
        receiverEmail: user.email,
        subject: 'Verification email',
        templateName: 'verify-email.hbs',
        context: {
          name: user.name,
          otp: verificationCode,
        },
      });

      if (!isMailSent) {
        await this.usersService.deleteUser(user.id);
        throw new ServiceUnavailableException(
          Errors.FAILED_TO_SEND_VERIFICATION_EMAIL,
        );
      }

      await this.usersService.saveVerificationCode(user.id, verificationCode);

      return user;
    } catch (error) {
      throw error;
    }
  }

  private generateVerificationCode(length: number): string {
    const digits = '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return result;
  }
}
