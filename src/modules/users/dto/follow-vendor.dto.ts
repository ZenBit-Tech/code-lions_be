import { ApiProperty } from '@nestjs/swagger';

export class FollowDto {
  @ApiProperty({
    description: 'Indicates if the user is followed',
    example: true,
  })
  isFollowed: boolean;
}
