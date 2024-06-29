import { ApiProperty } from '@nestjs/swagger';

import { Color } from 'src/modules/products/entities/color.entity';
import { Image } from 'src/modules/products/entities/image.entity';
import { Styles } from 'src/modules/products/entities/styles.enum';
import { User } from 'src/modules/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';

@Entity('products')
export class Product {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Cool product',
    description: 'The name of the product',
    type: String,
  })
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @ApiProperty({
    example: 'cool-product',
    description: 'The slug of the product',
    type: String,
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @ApiProperty({
    example: 12300,
    description: 'The price of the product in cents',
    type: Number,
  })
  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    example: 'This is a cool product. Here is some more text.',
    description: 'The description of the product',
    type: String,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the vendor',
    type: String,
  })
  @Column('uuid')
  vendorId: string;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'vendorId' })
  user: User;

  @ApiProperty({
    example: `['61c674384-f944-401b-949b-b76e8793bdc9', '61c674384-f944-401b-949b-b76e8793bdc9']`,
    description: 'The IDs of the images',
    type: Image,
  })
  @OneToMany(() => Image, (image) => image.product)
  @JoinColumn({ name: 'id' })
  images: Image[];

  @ApiProperty({
    example: 'casual',
    description: 'The style of the product',
    enum: Styles,
  })
  @Column({ type: 'enum', enum: Styles, nullable: true })
  style: string;

  @ApiProperty({
    example: 'black,blue',
    description: 'The colors of the product',
    type: [Color],
  })
  @ManyToMany(() => Color, (color) => color.products, { eager: false })
  @JoinTable({
    name: 'product_colors',
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'color_id',
      referencedColumnName: 'id',
    },
  })
  color: Color[];

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the product was created',
    type: Date,
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    example: '2024-06-28 21:04:24',
    description: 'The date the product was last updated',
    type: Date,
  })
  @Column({ type: 'timestamp', default: null, nullable: true })
  lastUpdatedAt: Date;
}
