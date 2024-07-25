import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';

import { Address } from '../entities/address.entity';
import { Status } from '../entities/order-status.enum';
import { Order } from '../entities/order.entity';

export class OrderResponseDTO {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the order',
    type: String,
  })
  id: string;

  @ApiProperty({
    example: 15000,
    description: 'The total price of the order',
    type: Number,
  })
  price: number;

  @ApiProperty({
    example: 'published',
    description: 'The status of the order',
    enum: Status,
  })
  status: Status;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the order was created',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the vendor',
    type: String,
  })
  vendorId: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the buyer',
    type: String,
  })
  buyerId: string;

  @ApiProperty({ type: Address, description: 'The address of the order' })
  @Type(() => Address)
  address: Address;

  @ApiProperty({
    type: [ProductResponseDTO],
    description: 'The products of the order',
  })
  @Type(() => ProductResponseDTO)
  products: ProductResponseDTO[];

  constructor(order: Order) {
    this.id = order.id;
    this.products = order.products;
    this.price = order.price;
    this.status = order.status;
    this.createdAt = order.createdAt;
    this.vendorId = order.vendorId;
    this.buyerId = order.buyerId;
    this.address = order.address;
  }
}
