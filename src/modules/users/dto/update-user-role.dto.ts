import { ApiProperty } from '@nestjs/swagger';

import { IsEnum } from 'class-validator';
import { Errors } from 'src/common/errors';
import { Role } from 'src/modules/roles/role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'vendor',
    description: 'Role of user',
  })
  @IsEnum(Role, { message: Errors.INCORRECT_ROLE })
  role: Role;
}
