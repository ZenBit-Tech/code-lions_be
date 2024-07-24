import { ApiProperty } from '@nestjs/swagger';

import { ChatUserDto } from './chat-user.dto';

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  sender: ChatUserDto;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}
