import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';
import { Errors } from 'src/common/errors';
import { LoginDto } from 'src/modules/auth/dto/login.dto';

export class CreateUserDto extends LoginDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsNotEmpty({ message: Errors.USERS_NAME_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.NAME_IS_STRING })
  name: string;
}
