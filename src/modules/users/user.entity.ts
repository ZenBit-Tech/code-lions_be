import { ApiProperty } from '@nestjs/swagger';

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
  isVerified: boolean;

  @ApiProperty({
    example: '123456',
    description: 'The verification code of the user',
  })
  @Column({ nullable: true })
  verificationCode: string;

  @ApiProperty({
    example: new Date(),
    description: 'The expiration date of the verification code',
  })
  @Column({ type: 'timestamp', nullable: true })
  verificationCodeExpiration: Date;
}
