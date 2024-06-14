import { IsEnum } from 'class-validator';
import { Errors } from 'src/common/errors';
import { Role } from 'src/modules/roles/role.enum';

export class UpdateUserRoleDto {
  @IsEnum(Role, { message: Errors.INCORRECT_ROLE })
  role: Role;
}
