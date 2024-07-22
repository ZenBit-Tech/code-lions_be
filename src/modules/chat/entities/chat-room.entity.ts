import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/modules/users/user.entity';

import { Message } from './message.entity';

@Entity()
export class ChatRoom {
  @ApiProperty({
    example: '61c674384-f944-401b-949b-b76e8793bdc9',
    description: 'The ID of the chat room',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: () => [User],
    description: 'The participants of the chat room',
  })
  @ManyToMany(() => User, (user) => user.chatRooms)
  @JoinTable({
    name: 'user_chat_rooms',
    joinColumn: {
      name: 'chatRoomId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  participants: User[];

  @ApiProperty({
    type: () => [Message],
    description: 'The messages in the chat room',
  })
  @OneToMany(() => Message, (message) => message.chatRoom)
  messages: Message[];

  @ApiProperty({
    example: new Date(),
    description: 'The creation date of the chat room',
  })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({
    example: new Date(),
    description: 'The last update date of the chat room',
  })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
