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
    required: false,
  })
  content?: string;

  @ApiProperty({
    example: 'https://example.com/uploads/photo.jpg',
    description: 'The URL of the uploaded file',
    required: false,
  })
  fileUrl?: string;

  @ApiProperty({
    example: 'photo',
    description: 'The type of the uploaded file',
    required: false,
  })
  fileType?: string;
}
