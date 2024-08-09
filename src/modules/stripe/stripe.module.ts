import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from 'src/modules/cart/cart.module';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';

import { ApplicationFee } from './entities/stripe.entity';
import { StripeController } from './stripe.controller';
import { ConfigurableModuleClass } from './stripe.module-definition';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService],
  exports: [StripeService],
  controllers: [StripeController],
  imports: [
    ConfigModule,
    UsersModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    TypeOrmModule.forFeature([ApplicationFee]),
  ],
})
export class StripeModule extends ConfigurableModuleClass {}
