import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the second user',
  })
  @IsNotEmpty()
  @IsUUID()
  chatPartnerId: string;
}
