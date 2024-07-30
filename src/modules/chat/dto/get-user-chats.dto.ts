import { ApiProperty } from '@nestjs/swagger';

import { ChatUserDto } from './chat-user.dto';
import { MessageResponseDto } from './message-response.dto';

export class GetUserChatsDto {
  @ApiProperty({
    description: 'Unique identifier of the chat room',
    example: '7b4b5875-2d0c-4bee-924a-1bdc7e6d3ef4',
  })
  id: string;

  @ApiProperty({
    description: 'Details of the chat partner',
    type: ChatUserDto,
  })
  chatPartner: ChatUserDto;

  @ApiProperty({
    description: 'Number of unread messages in the chat room',
    example: 3,
  })
  unreadMessageCount: number;

  @ApiProperty({
    description: 'The last message in the chat room',
    type: MessageResponseDto,
  })
  lastMessage: MessageResponseDto;

  constructor(partial: Partial<GetUserChatsDto>) {
    Object.assign(this, partial);
  }
}
