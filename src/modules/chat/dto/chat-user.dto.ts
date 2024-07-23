import { ApiProperty } from '@nestjs/swagger';

export class ChatUserDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the chat partner',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the chat partner',
  })
  name: string;

  @ApiProperty({
    example: 'file-1718301871158-882823500.jpg',
    description: 'The photo URL of the chat partner',
  })
  photoUrl: string;
}
