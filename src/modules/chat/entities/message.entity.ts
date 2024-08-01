import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { User } from 'src/modules/users/user.entity';

import { ChatRoom } from './chat-room.entity';
import { MessageRead } from './message-read.entity';

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
  @Column({ nullable: true })
  content: string;

  @ApiProperty({
    example: 'https://example.com/uploads/photo.jpg',
    description: 'The URL of the uploaded file',
  })
  @Column({ nullable: true })
  fileUrl: string;

  @ApiProperty({
    example: 'photo',
    description: 'The type of the uploaded file',
  })
  @Column({ nullable: true })
  fileType: string;

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

  @ApiProperty({
    type: () => [MessageRead],
    description: 'The read statuses of the message',
  })
  @OneToMany(() => MessageRead, (messageRead) => messageRead.message)
  reads: MessageRead[];
}
