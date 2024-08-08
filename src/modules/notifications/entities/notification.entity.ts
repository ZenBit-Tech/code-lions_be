import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Type } from 'src/modules/notifications/entities/notification-type.enum';
import { Status } from 'src/modules/orders/entities/order-status.enum';
import { User } from 'src/modules/users/user.entity';

@Entity('notifications')
export class Notification {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the notification',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Shipping updates',
    description: 'The type of the notification',
    enum: Type,
  })
  @Column({
    type: 'enum',
    enum: Type,
    nullable: false,
  })
  type: Type;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the notification was created',
    type: Date,
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user receiving the notification',
    type: String,
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    example: '4',
    description: 'The ID of the user receiving the notification',
    type: String,
  })
  @Column({
    type: 'number',
    nullable: true,
  })
  orderId: number;

  @ApiProperty({
    example: 'published',
    description: 'The status of the order',
    enum: Status,
  })
  @Column({
    type: 'enum',
    enum: Status,
    nullable: true,
  })
  shippingStatus: Status;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
