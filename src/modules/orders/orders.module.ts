import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from 'src/modules/cart/cart.entity';
import { EventsModule } from 'src/modules/events/events.module';
import { MailerModule } from 'src/modules/mailer/mailer.module';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { BuyerOrder } from 'src/modules/orders/entities/buyer-order.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { OrdersController } from 'src/modules/orders/orders.controller';
import { OrdersService } from 'src/modules/orders/orders.service';
import { Product } from 'src/modules/products/entities/product.entity';
import { Review } from 'src/modules/reviews/review.entity';
import { StripeModule } from 'src/modules/stripe/stripe.module';
import { User } from 'src/modules/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      User,
      Product,
      BuyerOrder,
      Cart,
      Notification,
      Review,
    ]),
    MailerModule,
    forwardRef(() => EventsModule),
    forwardRef(() => StripeModule),
    ScheduleModule.forRoot(),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
