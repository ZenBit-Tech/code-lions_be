import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  JoinColumn,
  Index,
} from 'typeorm';

import { Status } from 'src/modules/orders/entities/order-status.enum';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';
import { v4 as uuidv4 } from 'uuid';

import { AddressDTO } from '../dto/address.dto';

import { BuyerOrder } from './buyer-order.entity';

@Entity('orders')
@Index('idx_orders_id', ['id'])
export class Order {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the order',
    type: String,
  })
  @Column('uuid')
  id: string;

  @ApiProperty({
    example: 1,
    description: 'The order number',
    type: Number,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'orderId' })
  orderId: number;

  @ApiProperty({
    example: 15,
    description: 'The order`s shipping',
    type: Number,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  shipping: number;

  @ApiProperty({
    example: 'product1 , product2',
    description: 'The products of the order',
    type: [Product],
  })
  @ManyToMany(() => Product, (product) => product.orders, { eager: false })
  @JoinTable({
    name: 'order_products',
    joinColumn: {
      name: 'order_id',
      referencedColumnName: 'orderId',
    },
    inverseJoinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
  })
  products: ProductResponseDTO[];

  @ApiProperty({
    example: 15000,
    description: 'The price of the order',
    type: Number,
  })
  @Column({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    example: 'Sent',
    description: 'The status of the order',
    enum: Status,
  })
  @Column({
    type: 'enum',
    enum: Status,
    nullable: false,
    default: Status.NEW_ORDER,
  })
  status: Status;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the order was created',
    type: Date,
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    example: 7,
    description: 'The duration of how long user can own products from order',
  })
  @Column({ type: 'int', default: 0 })
  duration: number;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the order was received',
    type: Date,
  })
  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the vendor',
    type: String,
  })
  @Column('uuid')
  vendorId: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the buyer',
    type: String,
  })
  @Column('uuid')
  buyerId: string;

  @ApiProperty({
    example: `{Canada, Street1, Street2, ...}`,
    description: 'The address of the order',
    type: AddressDTO,
  })
  @Column({ type: 'json', nullable: true })
  address: AddressDTO;

  @ManyToMany(() => User, (user) => user.productsOrder)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the buyer order',
    type: String,
  })
  @ManyToOne(() => BuyerOrder, (buyerOrder) => buyerOrder.orders)
  @JoinColumn({ name: 'buyer_order_id' })
  buyerOrder: BuyerOrder;

  @BeforeInsert()
  generateUUID(): void {
    this.id = uuidv4();
  }
}
