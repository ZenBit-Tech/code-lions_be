import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  JoinTable,
  Column,
  OneToMany,
} from 'typeorm';

import { Order } from 'src/modules/orders/entities/order.entity';
import { User } from 'src/modules/users/user.entity';

import { Status } from './order-status.enum';

@Entity('buyer_order')
export class BuyerOrder {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the buyer`s order',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 15000,
    description: 'The price of the buyer`s order',
    type: Number,
  })
  @Column({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    example: 150,
    description: 'The order`s shipping',
    type: Number,
  })
  @Column({ type: 'int' })
  shipping: number;

  @ApiProperty({
    example: 'published',
    description: 'The status of the buyer`s order',
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
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
    type: String,
  })
  @ManyToOne(() => User, (user) => user.buyerOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    example: [
      '61c674384-f944-401b-949b-b76e8793bdc9',
      '61c674384-f944-401b-949b-b76e8793bdca',
    ],
    description: 'The IDs of the orders',
    type: [String],
  })
  @OneToMany(() => Order, (order) => order.buyerOrders, { cascade: true })
  @JoinTable({
    name: 'buyer_order_orders',
    joinColumn: {
      name: 'buyer_order_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'order_id',
      referencedColumnName: 'id',
    },
  })
  orders: Order[];
}
