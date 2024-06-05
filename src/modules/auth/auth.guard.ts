import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Errors } from 'src/common/errors';

import { PublicUserDto } from '../users/dto/public-user.dto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = PublicUserDto>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(Errors.INVALID_TOKEN);
    }

    return user;
  }
}
