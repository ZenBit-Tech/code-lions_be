import { ApiProperty } from '@nestjs/swagger';

export class AccountLinkResponseDto {
  @ApiProperty({
    example: 'https://stripe.com/test_123',
    description: 'The URL for the hosted account onboarding flow',
  })
  url: string;
}
