import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
} from 'typeorm';

import { MAX_ORDER_NUMBER, MIN_ORDER_NUMBER } from 'src/config';
import { Status } from 'src/modules/orders/entities/order-status.enum';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';

import { AddressDTO } from '../dto/address.dto';

import { BuyerOrder } from './buyer-order.entity';

@Entity('orders')
export class Order {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the order',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 1,
    description: 'The order number',
    type: Number,
  })
  @Column({ type: 'int', unique: true })
  orderNumber: number;

  @ApiProperty({
    example: 15,
    description: 'The order`s shipping',
    type: Number,
  })
  @Column({ type: 'int' })
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
      referencedColumnName: 'id',
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
    example: 'published',
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
  address: AddressDTO;

  @ManyToMany(() => User, (user) => user.productsOrder)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => BuyerOrder, (buyerOrder) => buyerOrder.orders)
  buyerOrders: BuyerOrder[];

  @BeforeInsert()
  async setOrderNumber(): Promise<void> {
    this.orderNumber = await Order.createOrderNumber();
  }

  static async createOrderNumber(): Promise<number> {
    return (
      Math.floor(Math.random() * (MAX_ORDER_NUMBER - MIN_ORDER_NUMBER + 1)) +
      MIN_ORDER_NUMBER
    );
  }
}
