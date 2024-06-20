import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { Errors } from 'src/common/errors';

import { UsersService } from './users.service';

@Injectable()
export class UserIdGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = request.params.id;
    const adminId = await this.usersService.getAdminId();

    if (user.id !== userId && user.id !== adminId) {
      throw new UnauthorizedException(Errors.ACCESS_DENIED);
    }

    return true;
  }
}
