import { ApiProperty } from '@nestjs/swagger';

import { IsUUID } from 'class-validator';

export class FollowDto {
  @ApiProperty({
    example: '2c674384-f944-401b-949b-b76e8793bdc2',
    description: 'The ID of the buyer',
  })
  @IsUUID()
  buyerId: string;

  @ApiProperty({
    example: '1c674384-f944-401b-949b-b76e8793bdc1',
    description: 'The ID of the vendor',
  })
  @IsUUID()
  vendorId: string;
}
