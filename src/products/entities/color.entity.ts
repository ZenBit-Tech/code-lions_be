import { ApiProperty } from '@nestjs/swagger';

import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Product } from './product.entity';
@Entity()
export class Color {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  color: string;

  @ManyToMany(() => Product, (product) => product.color)
  products: Product[];
}
