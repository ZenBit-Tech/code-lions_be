import { ApiProperty } from '@nestjs/swagger';

import { PublicUserDto } from 'src/modules/users/dto/public-user.dto';

export class UserWithTokensDto extends PublicUserDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The refresh token',
  })
  refreshToken: string;
}
