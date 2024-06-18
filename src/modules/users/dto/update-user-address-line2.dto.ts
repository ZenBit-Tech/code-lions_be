import { ApiProperty } from '@nestjs/swagger';

import { IsString, Matches, MaxLength } from 'class-validator';
import { Errors } from 'src/common/errors';
import { LIMIT_OF_CHARACTERS_FOR_ADDRESS } from 'src/config';

export class UpdateUserAddressLine2Dto {
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
}
