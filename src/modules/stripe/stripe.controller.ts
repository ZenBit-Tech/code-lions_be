import {
  Body,
  Controller,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { PaymentDto } from 'src/modules/stripe/dto/payment.dto';
import { StripeService } from 'src/modules/stripe/stripe.service';
import Stripe from 'stripe';

import { Role } from '../roles/role.enum';
import { Roles } from '../roles/roles.decorator';
import { User } from '../users/user.entity';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  async createCheckoutSession(
    @Body() payment: PaymentDto,
    @Request() request: { user: User },
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const session = await this.stripeService.createCheckoutSession(
      request.user.id,
      payment,
    );

    return session;
  }

  @Post('webhook')
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Body() event: string,
  ): Promise<{ received: boolean }> {
    const checkedEvent = await this.stripeService.checkSignature(
      event,
      signature,
    );

    return await this.stripeService.webhookHandler(checkedEvent);
  }
}
