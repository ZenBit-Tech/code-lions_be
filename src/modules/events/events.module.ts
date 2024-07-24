import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';

import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  imports: [ChatModule],
})
export class EventsModule {}
