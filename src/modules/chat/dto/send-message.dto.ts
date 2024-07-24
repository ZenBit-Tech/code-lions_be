import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the chat',
  })
  chatId: string;

  @ApiProperty({
    example: 'Hello, world!',
    description: 'The content of the message',
  })
  content: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the sender',
  })
  senderId: string;
}
