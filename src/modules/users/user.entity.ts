import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';

import { Cart } from 'src/modules/cart/cart.entity';
import { ChatRoom } from 'src/modules/chat/entities/chat-room.entity';
import { MessageRead } from 'src/modules/chat/entities/message-read.entity';
import { Message } from 'src/modules/chat/entities/message.entity';
import { BuyerOrder } from 'src/modules/orders/entities/buyer-order.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { RoleForUser } from 'src/modules/roles/role-user.enum';
import { Role } from 'src/modules/roles/role.enum';
import { Wishlist } from 'src/modules/wishlist/wishlist.entity';

@Entity()
export class User {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the user',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @Column()
  name: string;

  @ApiProperty({
    uniqueItems: true,
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    example: '$2b$10$bcOlXlUdMoPiI1aZJgyXEeRXhbms7spSgaktfTskP01IDAObl7Aiu',
    description: 'The password of the user',
  })
  @Column()
  password: string;

  @ApiProperty({
    example: false,
    description: 'Indicates if the user is verified',
  })
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({
    example: '123456',
    description: 'OTP of the user',
  })
  @Column({ nullable: true })
  otp: string;

  @ApiProperty({
    example: new Date(),
    description: 'The expiration date of the OTP',
  })
  @Column({ type: 'timestamp', nullable: true })
  otpExpiration: Date;

  @ApiProperty({
    example: Role.BUYER,
    description: 'The role of the user',
    enum: Role,
  })
  @Column({
    type: 'enum',
    enum: Role,
    nullable: true,
  })
  role: Role | RoleForUser;

  @ApiProperty({
    example: '107289041235675675',
    description: 'The Google ID of the user',
  })
  @Column({ nullable: true, default: null })
  googleId: string | null;

  @ApiProperty({
    example: true,
    description: 'Indicates if the users profile is active',
  })
  @Column({ default: true })
  isAccountActive: boolean;

  @ApiProperty({
    example: 'file-1718301871158-882823500.jpg',
    description: 'The users profile photo',
  })
  @Column({
    nullable: true,
    default: null,
  })
  photoUrl: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number of the user',
  })
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Address line 1 of the user',
  })
  @Column({ nullable: true })
  addressLine1: string;

  @ApiProperty({
    example: 'Apt 101',
    description: 'Address line 2 of the user',
  })
  @Column({ nullable: true })
  addressLine2: string;

  @ApiProperty({
    example: 'Canada',
    description: 'Country of the user',
  })
  @Column({
    nullable: false,
    default: 'Canada',
  })
  country: string;

  @ApiProperty({
    example: 'Ontario',
    description: 'State of the user',
  })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({
    example: 'Toronto',
    description: 'City of the user',
  })
  @Column({ nullable: true })
  city: string;

  @ApiProperty({
    example: 'L',
    description: 'Clothes size of the user',
  })
  @Column({ nullable: true })
  clothesSize: string;

  @ApiProperty({
    example: 'W 27 H 33',
    description: 'Jeans size of the user',
  })
  @Column({ nullable: true })
  jeansSize: string;

  @ApiProperty({
    example: '10',
    description: 'Shoes size of the user',
  })
  @Column({ nullable: true })
  shoesSize: string;

  @ApiProperty({
    example: '1234 5678 9012 3456',
    description: 'Card number of the user',
  })
  @Column({ nullable: true })
  cardNumber: string;

  @ApiProperty({
    example: '12/24',
    description: 'Expiration date of the card',
  })
  @Column({ nullable: true })
  expireDate: string;

  @ApiProperty({
    example: '123',
    description: 'CVV code of the card',
  })
  @Column({ nullable: true })
  cvvCode: string;

  @ApiProperty({
    example: false,
    description:
      'Indicates if needed to show rental rules to the user before add the product to cart',
  })
  @Column({ default: false })
  willHideRentalRules: boolean;

  @ApiProperty({
    example: new Date(),
    description: 'The creation date of the user',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The last update date of the user',
  })
  @Column({ type: 'timestamp', nullable: true })
  lastUpdatedAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The date of deactivation of the account of the user',
  })
  @Column({ type: 'timestamp', nullable: true })
  deactivationTimestamp: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The date of reactivation of the account of the user',
  })
  @Column({ type: 'timestamp', nullable: true })
  reactivationTimestamp: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The deletion date of the user',
  })
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @ApiProperty({
    example: '1',
    description:
      'Indicates how many steps user completed filling shipping profile',
  })
  @Column({ default: 1, nullable: true })
  onboardingStep: number;

  @ApiProperty({
    example: 4.98,
    description:
      'The average rating of the user from reviews. It ranges from 0.00 to 5.00.',
  })
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  rating: number;

  @ApiProperty({
    example: 2000,
    description: 'The sum of user orders',
  })
  @Column({ type: 'int', default: 0 })
  orders: number;

  @BeforeInsert()
  updateDatesBeforeInsert(): void {
    this.createdAt = new Date();
  }

  @BeforeUpdate()
  updateDatesBeforeUpdate(): void {
    this.lastUpdatedAt = new Date();
  }

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Cart, (cart) => cart.user)
  cart: Cart[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlist: Wishlist[];

  @ManyToMany(() => ChatRoom, (chatRoom) => chatRoom.participants)
  chatRooms: ChatRoom[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @ManyToMany(() => Order, (order) => order.user)
  productsOrder: Order[];

  @OneToMany(() => BuyerOrder, (buyerOrder) => buyerOrder.user)
  buyerOrders: BuyerOrder[];

  @OneToMany(() => MessageRead, (messageRead) => messageRead.user)
  readMessages: MessageRead[];
}
