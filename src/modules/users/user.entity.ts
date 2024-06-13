import { ApiProperty } from '@nestjs/swagger';

import { Role } from 'src/modules/roles/role.enum';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  @Column()
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
  role: Role;

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
    nullable: false,
    default: './uploads/avatars/file-1718301871158-882823500.jpg',
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
    example: 'California',
    description: 'State of the user',
  })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({
    example: 'Los Angeles',
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
}
