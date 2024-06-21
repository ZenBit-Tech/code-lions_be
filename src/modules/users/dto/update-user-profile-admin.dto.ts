import { ApiProperty } from '@nestjs/swagger';

import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Errors } from 'src/common/errors';
import { LIMIT_OF_CHARACTERS_FOR_ADDRESS, MAX_NAME_LENGTH } from 'src/config';

export class UpdateUserProfileByAdminDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsNotEmpty({ message: Errors.USERS_NAME_CANNOT_BE_EMPTY })
  @IsOptional()
  @IsString({ message: Errors.NAME_IS_STRING })
  @Length(1, MAX_NAME_LENGTH, {
    message: Errors.NAME_MAX_LENGTH,
  })
  name?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'New phone number of the user',
  })
  @IsOptional()
  @IsString({ message: Errors.PHONE_IS_STRING })
  @IsNotEmpty({ message: Errors.PHONE_CANNOT_BE_EMPTY })
  @Matches(/^\+\d{1,14}$/, {
    message: Errors.INCORRECT_PHONE,
  })
  phoneNumber?: string;

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
  @IsNotEmpty({ message: Errors.ADDRESS_CANNOT_BE_EMPTY })
  @IsOptional()
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  addressLine1?: string;

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
  @IsOptional()
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  addressLine2?: string;

  @ApiProperty({
    example: 'Canada',
    description: 'The user`s country',
  })
  @IsOptional()
  @IsNotEmpty({ message: Errors.COUNTRY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.COUNTRY_IS_STRING })
  country?: string;

  @ApiProperty({
    example: 'Nunavut',
    description: 'The user`s state',
  })
  @IsOptional()
  @IsNotEmpty({ message: Errors.USERS_STATE_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_STATE_IS_STRING })
  state?: string;

  @ApiProperty({
    example: 'Tuktoyaktuk',
    description: 'The user`s city',
  })
  @IsOptional()
  @IsNotEmpty({ message: Errors.USERS_CITY_CANNOT_BE_EMPTY })
  @IsString({ message: Errors.USERS_CITY_IS_STRING })
  city?: string;

  @ApiProperty({
    example: true,
    description: "Indicates if the user's profile is active",
  })
  @IsOptional()
  @IsBoolean()
  isAccountActive?: boolean;
}
