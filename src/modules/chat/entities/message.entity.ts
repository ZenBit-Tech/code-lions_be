import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from 'src/modules/users/user.entity';

import { ChatRoom } from './chat-room.entity';

@Entity()
export class Message {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the message',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Hello, world!',
    description: 'The content of the message',
  })
  @Column()
  content: string;

  @ApiProperty({
    type: () => User,
    description: 'The sender of the message',
  })
  @ManyToOne(() => User, (user) => user.messages)
  sender: User;

  @ApiProperty({
    type: () => ChatRoom,
    description: 'The chat room where the message was sent',
  })
  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages)
  chatRoom: ChatRoom;

  @ApiProperty({
    example: new Date(),
    description: 'The creation date of the message',
  })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The last update date of the message',
  })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
