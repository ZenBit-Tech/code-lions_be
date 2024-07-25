import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { Address } from 'src/modules/orders/entities/address.entity';
import { Status } from 'src/modules/orders/entities/order-status.enum';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';

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
    type: Address,
  })
  @ManyToOne(() => Address, (address) => address.orders, { eager: true })
  @JoinColumn({ name: 'address_id' })
  address: Address;

  @ManyToMany(() => User, (user) => user.productsOrder)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
