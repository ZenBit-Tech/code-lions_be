import { ApiProperty } from '@nestjs/swagger';

import { User } from 'src/modules/users/user.entity';
import { Styles } from 'src/products/entities/styles.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Product {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Cool product',
    description: 'The name of the product',
  })
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @ApiProperty({
    example: 'cool-product',
    description: 'The slug of the product',
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @ApiProperty({
    example: 12300,
    description: 'The price of the product in cents',
  })
  @Column({ type: 'int' })
  price: number;

  @ApiProperty({
    example: 'This is a cool product. Here is some more text.',
    description: 'The description of the product',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the vendor',
  })
  @Column('uuid')
  vendorId: string;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'vendorId' })
  user: User;

  @ApiProperty({
    example: 'casual',
    description: 'The style of the product',
    enum: Styles,
  })
  @Column({ type: 'enum', enum: Styles, nullable: true })
  style: string;
}
