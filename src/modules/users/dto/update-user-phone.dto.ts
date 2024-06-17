import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { Errors } from 'src/common/errors';

export class UpdateUserPhoneDto {
  @ApiProperty({
    example: '+1234567890',
    description: 'New phone number of the user',
  })
  @IsString({ message: Errors.PHONE_IS_STRING })
  @IsNotEmpty({ message: Errors.PHONE_CANNOT_BE_EMPTY })
  @Matches(/^\+\d{1,14}$/, {
    message: Errors.INCORRECT_PHONE,
  })
  phoneNumber: string;
}
