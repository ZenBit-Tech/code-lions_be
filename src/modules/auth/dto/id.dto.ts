import { ApiProperty } from '@nestjs/swagger';

import { IsUUID } from 'class-validator';
import { Errors } from 'src/common/errors';
import { UUID_VERSION } from 'src/config';

export class IdDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
  })
  @IsUUID(UUID_VERSION, { message: Errors.INVALID_USER_ID })
  id: string;
}
