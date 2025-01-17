import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';

import { Cart } from 'src/modules/cart/cart.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Brand } from 'src/modules/products/entities/brands.entity';
import { Category } from 'src/modules/products/entities/category.enum';
import { Color } from 'src/modules/products/entities/color.entity';
import { Image } from 'src/modules/products/entities/image.entity';
import { Materials } from 'src/modules/products/entities/materials.enum';
import { Status } from 'src/modules/products/entities/product-status.enum';
import { ProductTypes } from 'src/modules/products/entities/product-types.enum';
import { Styles } from 'src/modules/products/entities/styles.enum';
import { User } from 'src/modules/users/user.entity';
import { Wishlist } from 'src/modules/wishlist/wishlist.entity';

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
    example: false,
    description: '',
  })
  @Column({ default: false })
  isProductCreationFinished: boolean;

  @ApiProperty({
    example: 'cool-product',
    description: 'The slug of the product',
    type: String,
  })
  @Column({ type: 'varchar', length: 100 })
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

  @Column({
    type: 'set',
    enum: Category,
    nullable: true,
  })
  categories: Category[];

  @ApiProperty({
    example: 'casual',
    description: 'The style of the product',
    enum: Styles,
  })
  @Column({ type: 'enum', enum: Styles, nullable: true })
  style: Styles;

  @ApiProperty({
    example: 'cotton',
    description: 'The material of the product',
    enum: Materials,
  })
  @Column({ type: 'enum', enum: Materials, nullable: true })
  material: Materials;

  @ApiProperty({
    example: 'dress',
    description: 'The type of the product',
    enum: ProductTypes,
  })
  @Column({
    type: 'enum',
    enum: ProductTypes,
    nullable: false,
    default: ProductTypes.OTHER,
  })
  type: ProductTypes;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @ApiProperty({
    example: 'M',
    description: 'The size of the product',
    type: String,
  })
  @Column({ type: 'varchar', length: 15, nullable: true })
  size: string;

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
    example: 'file-1718301871158-882823500.pdf',
    description: 'The URL of the PDF file which is attached to the product',
  })
  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
  })
  pdfUrl: string;

  @ApiProperty({
    example: 'published',
    description: 'The status of the product',
    enum: Status,
  })
  @Column({
    type: 'enum',
    enum: Status,
    nullable: false,
    default: Status.INACTIVE,
  })
  status: Status;

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

  @ApiProperty({
    example: new Date(),
    description: 'The deletion date of the product',
  })
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indicates if the product is available',
  })
  @Column({ default: true })
  isAvailable: boolean;

  @OneToMany(() => Cart, (cart) => cart.product)
  cart: Cart[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlistEntries: Wishlist[];

  @ManyToMany(() => Order, (order) => order.products)
  orders: Order[];
}
