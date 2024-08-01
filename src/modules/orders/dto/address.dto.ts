import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Errors } from 'src/common/errors';
import { LIMIT_OF_CHARACTERS_FOR_ADDRESS } from 'src/config';

export class AddressDTO {
  @ApiProperty({
    example: '123 Main St',
    description: 'First address line of the user',
    type: String,
  })
  @MaxLength(LIMIT_OF_CHARACTERS_FOR_ADDRESS, {
    message: Errors.TOO_LONG_ADDRESS_LINE1,
  })
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  @IsNotEmpty({ message: Errors.ADDRESS_CANNOT_BE_EMPTY })
  addressLine1: string;

  @ApiProperty({
    example: 'Apt 101',
    description: 'Second address line of the user',
    type: String,
  })
  @MaxLength(LIMIT_OF_CHARACTERS_FOR_ADDRESS, {
    message: Errors.TOO_LONG_ADDRESS_LINE2,
  })
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  addressLine2: string;

  @ApiProperty({
    example: 'Canada',
    description: 'The user`s country',
    type: String,
  })
  @IsNotEmpty({ message: Errors.COUNTRY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.COUNTRY_IS_STRING })
  country: string;

  @ApiProperty({
    example: 'Nunavut',
    description: 'The user`s state',
    type: String,
  })
  @IsNotEmpty({ message: Errors.USERS_STATE_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_STATE_IS_STRING })
  state: string;

  @ApiProperty({
    example: 'Tuktoyaktuk',
    description: 'The user`s city',
    type: String,
  })
  @IsNotEmpty({ message: Errors.USERS_CITY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_CITY_IS_STRING })
  city: string;
}
