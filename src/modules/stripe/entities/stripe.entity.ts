import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ApplicationFee {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-ab12-cd34ef56gh78',
    description: 'The ID of the Stripe entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 0.05,
    description: 'The application fee for the transaction',
  })
  @Column({ type: 'decimal', scale: 2 })
  applicationFee: number;

  @ApiProperty({
    example: new Date(),
    description: 'The creation date of the record',
  })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The last update date of the record',
  })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
