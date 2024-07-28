import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
  @ApiProperty({
    example: [
      '1rm07r7r-t98p-5q9q-8p59-33sq0p8s3219',
      '2rm07r7r-t98p-5q9q-8p59-33sq0p8s3219',
    ],
    description: 'The IDs of the products',
  })
  productIds: string[];

  @ApiProperty({
    example: 15,
    description: 'The shipping fee for the order group',
  })
  shippingFee: number;
}
