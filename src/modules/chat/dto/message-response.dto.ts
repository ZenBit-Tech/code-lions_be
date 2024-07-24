import { ApiProperty } from '@nestjs/swagger';

import { ChatUserDto } from './chat-user.dto';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the message',
    example: '7b4b5875-2d0c-4bee-924a-1bdc7e6d3ef4',
  })
  id: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello, how are you?',
  })
  content: string;

  @ApiProperty({
    description: 'Timestamp when the message was created',
    example: '2024-07-24T09:38:17.495Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Details of the user who sent the message',
    type: ChatUserDto,
  })
  sender: ChatUserDto;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}
