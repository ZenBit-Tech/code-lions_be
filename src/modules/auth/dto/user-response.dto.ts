import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
  })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  name: string;

  @ApiProperty({
    example: 'example@example.com',
    description: 'The email of the user',
  })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user is verified',
  })
  isEmailVerified: boolean;
}
