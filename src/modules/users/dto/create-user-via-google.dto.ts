import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsBoolean } from 'class-validator';
import { Errors } from 'src/common/errors';

import { CreateUserDto } from './create-user.dto';

export class CreateUserViaGoogleDto extends CreateUserDto {
  @ApiProperty({
    example: '107289041235675675',
    description: 'The Google ID of the user',
  })
  @IsString({ message: Errors.INVALID_GOOGLE_ID })
  googleId: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user is verified',
  })
  @IsBoolean()
  isEmailVerified: boolean;
}
