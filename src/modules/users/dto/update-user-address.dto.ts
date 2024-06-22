import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { Errors } from 'src/common/errors';
import { LIMIT_OF_CHARACTERS_FOR_ADDRESS } from 'src/config';

export class UpdateUserAddressDto {
  @ApiProperty({
    example: '123 Main St',
    description: 'First address line of the user',
  })
  @Matches(/^[a-zA-Z0-9\s,.'-]*$/, {
    message: Errors.INCORRECT_ADDRESS_LINE1,
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
  })
  @Matches(/^[a-zA-Z0-9\s,.'-]*$/, {
    message: Errors.INCORRECT_ADDRESS_LINE2,
  })
  @MaxLength(LIMIT_OF_CHARACTERS_FOR_ADDRESS, {
    message: Errors.TOO_LONG_ADDRESS_LINE2,
  })
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  addressLine2: string;

  @ApiProperty({
    example: 'Canada',
    description: 'The user`s country',
  })
  @IsNotEmpty({ message: Errors.COUNTRY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.COUNTRY_IS_STRING })
  country: string;

  @ApiProperty({
    example: 'Nunavut',
    description: 'The user`s state',
  })
  @IsNotEmpty({ message: Errors.USERS_STATE_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_STATE_IS_STRING })
  state: string;

  @ApiProperty({
    example: 'Tuktoyaktuk',
    description: 'The user`s city',
  })
  @IsNotEmpty({ message: Errors.USERS_CITY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_CITY_IS_STRING })
  city: string;
}
