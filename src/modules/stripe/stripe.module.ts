import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CartModule } from 'src/modules/cart/cart.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';

import { StripeController } from './stripe.controller';
import { ConfigurableModuleClass } from './stripe.module-definition';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService],
  exports: [StripeService],
  controllers: [StripeController],
  imports: [ConfigModule, UsersModule, ProductsModule, CartModule],
})
export class StripeModule extends ConfigurableModuleClass {}
