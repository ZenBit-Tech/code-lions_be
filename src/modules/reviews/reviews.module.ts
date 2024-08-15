import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsModule } from 'src/modules/events/events.module';
import { MailerModule } from 'src/modules/mailer/mailer.module';
import { Order } from 'src/modules/orders/entities/order.entity';
import { User } from 'src/modules/users/user.entity';

import { Review } from './review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, User, Order]),
    MailerModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
