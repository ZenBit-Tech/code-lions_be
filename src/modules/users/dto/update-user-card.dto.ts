import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty } from 'class-validator';
import { Errors } from 'src/common/errors';

export class UpdateUserCardDto {
  @ApiProperty({
    example: '1234 5678 9012 3456',
    description: 'Card number of the user',
  })
  @IsString({ message: Errors.CARD_NUMBER_IS_STRING })
  @IsNotEmpty({ message: Errors.CARD_NUMBER_CANNOT_BE_EMPTY })
  cardNumber: string;

  @ApiProperty({
    example: '12/24',
    description: 'Expiration date of the card',
  })
  @IsString({ message: Errors.EXPIRE_DATE_IS_STRING })
  @IsNotEmpty({ message: Errors.EXPIRE_DATE_CANNOT_BE_EMPTY })
  expireDate: string;

  @ApiProperty({
    example: '123',
    description: 'CVV code of the card',
  })
  @IsString({ message: Errors.CVV_CODE_IS_STRING })
  @IsNotEmpty({ message: Errors.CVV_CODE_CANNOT_BE_EMPTY })
  cvvCode: string;
}
