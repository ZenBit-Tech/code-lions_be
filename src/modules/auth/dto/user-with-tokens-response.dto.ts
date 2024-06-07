import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';

export class UserWithTokensResponseDto extends UserResponseDto {
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
