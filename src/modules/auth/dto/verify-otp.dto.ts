import { ApiProperty } from '@nestjs/swagger';

import { IsString, Length, Matches } from 'class-validator';
import { Errors } from 'src/common/errors';
import { VERIFICATION_CODE_LENGTH } from 'src/config';

import { IdDto } from './id.dto';

export class VerifyOtpDto extends IdDto {
  @ApiProperty({
    example: '123456',
    description: 'The verification code which was sent to the user',
  })
  @IsString()
  @Length(VERIFICATION_CODE_LENGTH, VERIFICATION_CODE_LENGTH, {
    message: Errors.CODE_LENGTH,
  })
  @Matches(/^[0-9]+$/, { message: Errors.DIGITS_ONLY })
  otp: string;
}
