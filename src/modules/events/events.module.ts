import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { NotificationsModule } from 'src/modules/notifications/notifications.module';

import { ChatModule } from '../chat/chat.module';
import { UsersModule } from '../users/users.module';

import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  imports: [
    forwardRef(() => ChatModule),
    forwardRef(() => NotificationsModule),
    JwtModule,
    forwardRef(() => UsersModule),
  ],
  exports: [EventsGateway],
})
export class EventsModule {}
