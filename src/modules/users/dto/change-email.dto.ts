import { ApiProperty } from '@nestjs/swagger';

import { IsEmail } from 'class-validator';
import { Errors } from 'src/common/errors';

export class ChangeEmailDto {
  @ApiProperty({
    example: 'example@example.com',
    description: 'The email of the user',
  })
  @IsEmail({}, { message: Errors.INVALID_EMAIL })
  email: string;
}
