import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToMany,
} from 'typeorm';

import { Order } from 'src/modules/orders/entities/order.entity';
import { User } from 'src/modules/users/user.entity';

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
    example: ' pm_1Phqc5Cj7lDMnopKDgRwhwAb',
    description: 'The Payment ID of the order',
  })
  @Column({ nullable: true, default: null })
  paymentId: string | null;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the payment was done',
    type: Date,
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

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
    example: true,
    description: 'Indicates the buyer order is paid',
  })
  @Column({ default: false })
  isPaid: boolean;

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
  @OneToMany(() => Order, (order) => order.buyerOrder, { cascade: true })
  orders: Order[];
}
