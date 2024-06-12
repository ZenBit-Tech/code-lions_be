import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Errors } from 'src/common/errors';

import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = UserResponseDto>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(Errors.INVALID_TOKEN);
    }

    return user;
  }
}
