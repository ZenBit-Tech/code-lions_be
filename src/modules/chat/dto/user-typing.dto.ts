import { ApiProperty } from '@nestjs/swagger';

export class UserTypingDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the chat',
  })
  chatId: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user who is typing',
  })
  userId: string;

  @ApiProperty({
    example: 'true',
    description: 'Typing status',
  })
  typing: boolean;
}
