import { Inject, Injectable } from '@nestjs/common';

import Stripe from 'stripe';

import { StripeModuleOptions } from './stripe.interfaces';
import { MODULE_OPTIONS_TOKEN } from './stripe.module-definition';

@Injectable()
export class StripeService {
  public readonly StripeApi: Stripe;
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private options: StripeModuleOptions,
  ) {
    this.StripeApi = new Stripe(this.options.apiKey, this.options.options);
  }

  async createCustomer(
    email: string,
  ): Promise<Stripe.Response<Stripe.Customer>> {
    return this.StripeApi.customers.create({
      email,
    });
  }

  async createCustomerSource(
    customerId: string,
    source: string,
  ): Promise<Stripe.Response<Stripe.CustomerSource>> {
    return this.StripeApi.customers.createSource(customerId, {
      source,
    });
  }

  async createCharge(
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<Stripe.Response<Stripe.Charge>> {
    return this.StripeApi.charges.create({
      amount,
      currency,
      customer: customerId,
    });
  }

  async getCustomerList(): Promise<
    Stripe.Response<Stripe.ApiList<Stripe.Customer>>
  > {
    return await this.StripeApi.customers.list();
  }
}
