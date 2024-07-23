import { ApiProperty } from '@nestjs/swagger';

import { ChatUserDto } from './chat-user.dto';
import { MessageResponseDto } from './message-response.dto';

export class ChatRoomResponseDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the chat room',
  })
  id: string;

  @ApiProperty({
    type: () => ChatUserDto,
    description: 'The chat partner in the chat room',
  })
  chatPartner: ChatUserDto;

  @ApiProperty({
    type: () => [MessageResponseDto],
    description: 'The last message in the chat room',
  })
  messages: MessageResponseDto[];
}
