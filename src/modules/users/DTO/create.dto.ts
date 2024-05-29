import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Errors } from 'src/common/errors';

export class CreateUserDTO {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsNotEmpty({ message: Errors.MISSING_CREDENTIALS })
  @IsString({ message: Errors.NAME_IS_STRING })
  name: string;

  @ApiProperty({
    example: 'example@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty({ message: Errors.MISSING_CREDENTIALS })
  @IsEmail({}, { message: Errors.EMAIL_FORMAT })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @IsNotEmpty({ message: Errors.MISSING_CREDENTIALS })
  @IsString({ message: Errors.PASSWORD_IS_STRING })
  @MinLength(8, { message: Errors.PASSWORD_LENGTH })
  password: string;
}
