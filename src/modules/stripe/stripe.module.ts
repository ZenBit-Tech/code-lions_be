import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from 'src/modules/cart/cart.module';
import { MailerModule } from 'src/modules/mailer/mailer.module';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';

import { ApplicationFee } from './entities/stripe.entity';
import { StripeController } from './stripe.controller';
import { StripeModuleOptions } from './stripe.interfaces';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './stripe.module-definition';
import { StripeService } from './stripe.service';

@Module({
  providers: [
    StripeService,
    {
      provide: MODULE_OPTIONS_TOKEN,
      useFactory: (configService: ConfigService): StripeModuleOptions => ({
        apiKey: configService.get<string>('STRIPE_SECRET_KEY'),
        options: {},
      }),
      inject: [ConfigService],
    },
  ],
  exports: [StripeService],
  controllers: [StripeController],
  imports: [
    ConfigModule,
    UsersModule,
    ProductsModule,
    MailerModule,
    CartModule,
    forwardRef(() => OrdersModule),
    TypeOrmModule.forFeature([ApplicationFee]),
  ],
})
export class StripeModule extends ConfigurableModuleClass {}
