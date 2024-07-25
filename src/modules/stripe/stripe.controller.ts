import { Body, Controller, Get, Post } from '@nestjs/common';

import { StripeService } from 'src/modules/stripe/stripe.service';
import Stripe from 'stripe';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Get()
  async getCustomerList(): Promise<
    Stripe.Response<Stripe.ApiList<Stripe.Customer>>
  > {
    return this.stripeService.getCustomerList();
  }

  @Post('create-customer')
  async createCustomer(
    @Body() { email }: { email: string },
  ): Promise<Stripe.Response<Stripe.Customer>> {
    return this.stripeService.createCustomer(email);
  }
}
