import { ApiProperty } from '@nestjs/swagger';

import { IsString, MinLength } from 'class-validator';
import { Errors } from 'src/common/errors';
import { MIN_PASSWORD_LENGTH } from 'src/config';

export class PasswordDto {
  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @IsString({ message: Errors.PASSWORD_IS_STRING })
  @MinLength(MIN_PASSWORD_LENGTH, { message: Errors.PASSWORD_LENGTH })
  password: string;
}
