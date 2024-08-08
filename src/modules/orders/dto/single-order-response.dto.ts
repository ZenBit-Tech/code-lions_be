import { ApiProperty } from '@nestjs/swagger';

import { AddressDTO } from './address.dto';
import { OrderResponseDTO } from './order-response.dto';

export class SingleOrderResponse {
  @ApiProperty({
    type: [OrderResponseDTO],
    description: 'Specific order response',
  })
  order: OrderResponseDTO[];

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user who placed the order',
  })
  userName: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user who placed the order',
  })
  userId: string;

  @ApiProperty({
    type: AddressDTO,
    description: 'The address to which the order is delivered',
  })
  address: AddressDTO;
}
