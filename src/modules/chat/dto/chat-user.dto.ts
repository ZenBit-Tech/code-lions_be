import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';

export class ChatUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  photoUrl: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
