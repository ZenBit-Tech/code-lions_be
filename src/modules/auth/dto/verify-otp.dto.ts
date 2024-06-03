import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsUUID, Length, Matches } from 'class-validator';
import { Errors } from 'src/common/errors';
import { VERIFICATION_CODE_LENGTH } from 'src/config';

const uuidVersion = 4;

export class VerifyOtpDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
  })
  @IsUUID(uuidVersion, { message: Errors.INVALID_USER_ID })
  id: string;

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
