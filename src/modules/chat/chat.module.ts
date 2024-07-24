import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, Message, User]), UsersModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
