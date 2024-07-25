import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChatModule } from '../chat/chat.module';
import { UsersModule } from '../users/users.module';

import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  imports: [ChatModule, JwtModule, UsersModule],
})
export class EventsModule {}
