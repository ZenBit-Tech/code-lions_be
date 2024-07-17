import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Product } from './product.entity';

@Entity('images')
export class Image {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the photo',
    type: String,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'https://example.com/example.png',
    description: 'The URL of the photo',
    type: String,
  })
  @Column({ type: 'varchar', length: 255, nullable: false })
  url: string;

  @ApiProperty({
    example: 'false',
    description: 'Indicates if the photo is primary',
    type: Boolean,
  })
  @Column({ type: 'boolean', default: false, nullable: false })
  isPrimary: boolean;

  @ManyToOne(() => Product, (product: Product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
