import { ApiProperty } from '@nestjs/swagger';

export class UserStatusResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the user is currently online',
  })
  isOnline: boolean;

  @ApiProperty({
    example: '2024-07-24T09:38:17.495Z',
    description: 'The timestamp of the last time the user was active',
  })
  lastActiveAt: Date;
}
