import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty } from 'class-validator';
import { Errors } from 'src/common/errors';

export class UpdateUserSizeDto {
  @ApiProperty({
    example: 'M',
    description: 'Clothes size of the user',
  })
  @IsString({ message: Errors.CLOTHES_SIZE_IS_STRING })
  @IsNotEmpty({ message: Errors.CLOTHES_SIZE_CANNOT_BE_EMPTY })
  clothesSize: string;

  @ApiProperty({
    example: 'W 27 H 33',
    description: 'Jeans size of the user',
  })
  @IsString({ message: Errors.JEANS_SIZE_IS_STRING })
  @IsNotEmpty({ message: Errors.JEANS_SIZE_CANNOT_BE_EMPTY })
  jeansSize: string;

  @ApiProperty({
    example: '10',
    description: 'Shoes size of the user',
  })
  @IsString({ message: Errors.SHOES_SIZE_IS_STRING })
  @IsNotEmpty({ message: Errors.SHOES_SIZE_CANNOT_BE_EMPTY })
  shoesSize: string;
}
