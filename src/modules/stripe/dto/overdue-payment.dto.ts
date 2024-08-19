import { ApiProperty } from '@nestjs/swagger';

export class OverduePaymentDto {
  @ApiProperty({
    example: 'acct_1Plh9CCi1h7VmCDv',
    description: 'The ID of the vendor account in Stripe',
  })
  vendorStripeAccount: string;

  @ApiProperty({
    example: 1,
    description: 'The ID of the order',
  })
  orderId: number;

  @ApiProperty({
    example: 100.0,
    description: 'The overdue payment amount (in $CAD)',
  })
  amount: number;
}
