import { ApiProperty } from '@nestjs/swagger';

import { IsString } from 'class-validator';

export class FollowVendorDto {
  @ApiProperty({
    example: '1c674384-f944-401b-949b-b76e8793bdc1',
    description: 'The ID of the vendor',
  })
  @IsString()
  vendorId: string;
}
