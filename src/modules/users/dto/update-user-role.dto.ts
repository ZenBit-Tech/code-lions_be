import { IsEnum } from 'class-validator';
import { Role } from 'src/modules/roles/role.enum';

export class UpdateUserRoleDto {
  @IsEnum(Role, { message: 'Invalid role' })
  role: Role;
}
