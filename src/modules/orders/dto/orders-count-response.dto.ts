import { ApiProperty } from '@nestjs/swagger';

import { OrderResponseDTO } from './order-response.dto';

export class OrdersAndCountResponseDTO {
  @ApiProperty({
    type: [OrderResponseDTO],
    description: 'The list of orders fetched',
  })
  orders: OrderResponseDTO[];

  @ApiProperty({
    example: 1,
    description: 'The count of orders fetched',
  })
  count: number;
}
