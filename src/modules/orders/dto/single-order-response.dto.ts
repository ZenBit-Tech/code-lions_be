import { AddressDTO } from './address.dto';
import { OrderResponseDTO } from './order-response.dto';

export class SingleOrderResponse {
  order: OrderResponseDTO[];
  userName: string;
  userId: string;
  address: AddressDTO;
}
