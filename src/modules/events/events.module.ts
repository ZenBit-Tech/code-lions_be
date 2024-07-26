import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChatModule } from '../chat/chat.module';
import { UsersModule } from '../users/users.module';

import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  imports: [forwardRef(() => ChatModule), JwtModule, UsersModule],
  exports: [EventsGateway],
})
export class EventsModule {}
