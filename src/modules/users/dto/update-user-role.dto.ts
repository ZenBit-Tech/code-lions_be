import { ApiProperty } from '@nestjs/swagger';

import { IsEnum } from 'class-validator';
import { Errors } from 'src/common/errors';
import { RoleForUser } from 'src/modules/roles/role-user.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'vendor',
    description: 'Role of user',
  })
  @IsEnum(RoleForUser, { message: Errors.INCORRECT_ROLE })
  role: RoleForUser;
}
