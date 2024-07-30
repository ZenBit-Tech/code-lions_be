import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { User } from 'src/modules/users/user.entity';

import { Message } from './message.entity';

@Entity()
export class MessageRead {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the read status',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => Message,
    description: 'The message that was read',
  })
  @ManyToOne(() => Message, (message) => message.reads, { onDelete: 'CASCADE' })
  message: Message;

  @ApiProperty({
    type: () => User,
    description: 'The user who read the message',
  })
  @ManyToOne(() => User, (user) => user.readMessages, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    example: new Date(),
    description: 'The date when the message was read',
  })
  @CreateDateColumn({ type: 'timestamp' })
  readAt: Date;
}
