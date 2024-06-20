import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { Errors } from 'src/common/errors';

@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = request.params.id;

    if (user.id !== userId) {
      throw new UnauthorizedException(Errors.ACCESS_DENIED);
    }

    return true;
  }
}
