import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StripeController } from './stripe.controller';
import { ConfigurableModuleClass } from './stripe.module-definition';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService],
  exports: [StripeService],
  controllers: [StripeController],
  imports: [ConfigModule],
})
export class StripeModule extends ConfigurableModuleClass {}
