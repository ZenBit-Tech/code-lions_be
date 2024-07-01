import { ApiProperty } from '@nestjs/swagger';

import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  BeforeInsert,
} from 'typeorm';

@Entity()
export class Wishlist {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the wishlist',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '2c674384-f944-401b-949b-b76e8793bdc2',
    description: 'The ID of the user',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    example: '1c674384-f944-401b-949b-b76e8793bdc1',
    description: 'The ID of the user',
  })
  @Column('uuid')
  productId: string;

  @ApiProperty({
    example: new Date(),
    description: 'The timestamp of adding the product to wishlist',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  updateDatesBeforeInsert(): void {
    this.createdAt = new Date();
  }

  @ManyToOne(() => User, (user) => user.wishlist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
