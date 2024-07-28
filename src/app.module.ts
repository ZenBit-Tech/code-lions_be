import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmConfigService } from 'src/config/typeorm';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CartModule } from 'src/modules/cart/cart.module';
import { GeoNamesModule } from 'src/modules/geoNames/geoNames.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { ReviewsModule } from 'src/modules/reviews/reviews.module';
import { UsersModule } from 'src/modules/users/users.module';
import { WishlistModule } from 'src/modules/wishlist/wishlist.module';

import { ChatModule } from './modules/chat/chat.module';
import { EventsModule } from './modules/events/events.module';
import { StripeModule } from './modules/stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    GeoNamesModule,
    ReviewsModule,
    ProductsModule,
    WishlistModule,
    CartModule,
    EventsModule,
    ChatModule,
    StripeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get<string>('STRIPE_SECRET_KEY'),
        options: {
          apiVersion: '2024-06-20',
        },
      }),
    }),
  ],
})
export class AppModule {}
