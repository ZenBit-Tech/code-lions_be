import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OAuth2Client } from 'google-auth-library';
import { Errors } from 'src/common/errors';

import { GooglePayloadDto } from './dto/google-payload.dto';

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  private client: OAuth2Client;
  private googleClientId: string;

  constructor(private configService: ConfigService) {
    const GOOGLE_CLIENT_ID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const GOOGLE_SECRET = this.configService.get<string>('GOOGLE_SECRET');

    this.googleClientId = GOOGLE_CLIENT_ID;

    this.client = new OAuth2Client(this.googleClientId, GOOGLE_SECRET);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.body.token;

    if (!token) {
      throw new BadRequestException(Errors.INVALID_GOOGLE_TOKEN);
    }

    const payload = await this.validate(token);

    request.googlePayload = payload;

    return true;
  }

  private async validate(token: string): Promise<GooglePayloadDto> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: this.googleClientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new BadRequestException(Errors.INVALID_GOOGLE_TOKEN);
      }

      const {
        sub,
        email,
        email_verified: isEmailVerified,
        given_name: givenName,
      } = payload;

      return { sub, email, isEmailVerified, givenName } as GooglePayloadDto;
    } catch (error) {
      throw new BadRequestException(Errors.INVALID_GOOGLE_TOKEN);
    }
  }
}
