import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { Errors } from 'src/common/errors';
import { LIMIT_OF_CHARACTERS_FOR_ADDRESS } from 'src/config';

export class UpdateUserAddressLine1Dto {
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
  @IsString({ message: Errors.ADDRESS_IS_STRING })
  addressLine1: string;
}
