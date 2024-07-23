import { ApiProperty } from '@nestjs/swagger';

import { ChatUserDto } from './chat-user.dto';

export class MessageResponseDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the message',
  })
  id: string;

  @ApiProperty({
    example: 'Hello, world!',
    description: 'The content of the message',
  })
  content: string;

  @ApiProperty({
    example: '2024-07-22T14:09:59.234Z',
    description: 'The timestamp when the message was created',
  })
  createdAt: Date;

  @ApiProperty({
    type: () => ChatUserDto,
    description: 'The sender of the message',
  })
  sender: ChatUserDto;
}
