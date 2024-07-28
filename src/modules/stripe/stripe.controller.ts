import {
  Body,
  Controller,
  Get,
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

  @Get()
  async getCustomerList(): Promise<
    Stripe.Response<Stripe.ApiList<Stripe.Customer>>
  > {
    return this.stripeService.getCustomerList();
  }

  /*
    @Post('create-payment-intent')
    async createPaymentIntent(): Promise<Stripe.Response<Stripe.PaymentIntent>> {
      return this.stripeService.createPaymentIntent();
    }
  */
  @Post('create-customer')
  async createCustomer(
    @Body() { email }: { email: string },
  ): Promise<Stripe.Response<Stripe.Customer>> {
    return this.stripeService.createCustomer(email);
  }

  @Post('create-checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  async createCheckoutSession(
    @Body() payment: PaymentDto,
    @Request() request: { user: User },
  ): Promise<void> {
    await this.stripeService.createCheckoutSession(request.user.id, payment);
  }

  @Post('webhook')
  async webhook(@Body() body: any): Promise<any> {
    /*
    console.log(body);
    return {
      message: 'Success',
    };*/
    const event = body;

    return this.stripeService.webhookHandler(event);
  }
}
