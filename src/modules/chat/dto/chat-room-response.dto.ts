import { ApiProperty } from '@nestjs/swagger';

import { ChatUserDto } from './chat-user.dto';
import { MessageResponseDto } from './message-response.dto';

export class ChatRoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  chatPartner: ChatUserDto;

  @ApiProperty()
  messages: MessageResponseDto[];

  constructor(partial: Partial<ChatRoomResponseDto>) {
    Object.assign(this, partial);
  }
}
