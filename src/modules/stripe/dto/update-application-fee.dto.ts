import { ApiProperty } from '@nestjs/swagger';

export class UpdateApplicationFeeDto {
  @ApiProperty({
    example: 0.05,
    description: 'The new application fee to be set',
    type: Number,
  })
  applicationFee: number;
}
