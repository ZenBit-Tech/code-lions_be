import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsEmail, IsBoolean, IsNotEmpty } from 'class-validator';
import { Errors } from 'src/common/errors';

export class GooglePayloadDto {
  @ApiProperty({
    example: '107289041235675675',
    description: 'The Google ID of the user',
  })
  @IsString({ message: Errors.INVALID_GOOGLE_ID })
  sub: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  @IsEmail({}, { message: Errors.INVALID_EMAIL })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the email is verified',
  })
  @IsBoolean()
  isEmailVerified: boolean;

  @ApiProperty({
    example: 'John',
    description: 'The name of the user',
  })
  @IsNotEmpty({ message: Errors.USERS_NAME_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.NAME_IS_STRING })
  givenName: string;
}
