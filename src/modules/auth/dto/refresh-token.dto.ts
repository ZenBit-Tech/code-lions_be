import { ApiProperty } from '@nestjs/swagger';

import { IsJWT } from 'class-validator';
import { Errors } from 'src/common/errors';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiOTRiMz...',
    description: 'The refresh token of the user',
  })
  @IsJWT({ message: Errors.REFRESH_TOKEN_SHOULD_BE_JWT })
  refreshToken: string;
}
