import { ApiProperty } from '@nestjs/swagger';

export class ChatUserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '3d14ab90-3182-4cd5-bae4-08b97832a8b9',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: "URL of the user's profile photo",
    example: 'https://example.com/uploads/avatars/user-photo.jpeg',
  })
  photoUrl: string;

  @ApiProperty({
    description: 'Indicates if the user is currently online',
    example: true,
  })
  isOnline: boolean;

  @ApiProperty({
    description: 'The timestamp of the last time the user was active',
    example: '2024-07-24T09:38:17.495Z',
  })
  lastActiveAt: Date;

  constructor(partial: Partial<ChatUserDto>) {
    Object.assign(this, partial);
  }
}
