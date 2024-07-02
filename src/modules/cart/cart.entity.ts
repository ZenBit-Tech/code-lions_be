import { ApiProperty } from '@nestjs/swagger';

import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('cart')
export class Cart {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the cart',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '37409332-c450-4854-a3b0-00ca9bbd212b',
    description: 'The ID of the user who owns the cart',
    type: String,
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    example: '1c674384-f944-401b-949b-b76e8793bdc1',
    description: 'The ID of the product added to the cart',
    type: String,
  })
  @Column('uuid')
  productId: string;

  @ApiProperty({
    example:
      'https://img.kwcdn.com/thumbnail/s/f09fce1e307adcde849148ecad30f7d5_fdd36fbfe57d.jpg?imageView2/2/w/650/q/50/format/webp',
    description: 'The URL of the product image',
    type: String,
  })
  @Column()
  productUrl: string;

  @ApiProperty({
    example: 'M',
    description: 'The size of the product',
    type: String,
  })
  @Column({ type: 'varchar', length: 15, nullable: true })
  size: string;

  @ApiProperty({
    example: 'green',
    description: 'The color of the product',
    type: String,
  })
  @Column()
  color: string;

  @ApiProperty({
    example: 7,
    description: 'The duration of rent',
    type: Number,
  })
  @Column()
  duration: number;

  @ApiProperty({
    example: 12300,
    description: 'The price of the product',
    type: Number,
  })
  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the cart item was created',
    type: Date,
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  updateDatesBeforeInsert(): void {
    this.createdAt = new Date();
  }

  @ManyToOne(() => User, (user) => user.cart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
