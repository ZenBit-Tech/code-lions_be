import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { Errors } from 'src/common/errors';
import { ProductsService } from 'src/modules/products/products.service';
import Stripe from 'stripe';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

import { PaymentDto } from './dto/payment.dto';
import { StripeModuleOptions } from './stripe.interfaces';
import { MODULE_OPTIONS_TOKEN } from './stripe.module-definition';

@Injectable()
export class StripeService {
  public readonly StripeApi: Stripe;
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private options: StripeModuleOptions,
    private usersServise: UsersService,
    private productsService: ProductsService,
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

  async createCheckoutSession(
    customerId: string,
    payment: PaymentDto,
  ): Promise<User> {
    //const { productIds, shippingFee } = payment;
    console.log(payment);
    try {
      const user = await this.usersServise.getUserById(customerId);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      //const products = await this.productsService.getProductsByIds(productIds);

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.PAYMENT_ERROR);
    }

    // const paymentIntent = await this.createPaymentIntent(amount);
    /*
    const session = await this.StripeApi.checkout.sessions.create({

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Black Circle service',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],

      payment_intent_data: {
        transfer_group: 'ORDER100',
        //application_fee_amount: amount * 10,
      },
          payment_intent_data: {
            transfer_group: 'ORDER_123',
            application_fee_amount: amount * 10,
            on_behalf_of: 'acct_1Ph9kdCmIXb3EALW',
          },
          metadata: {
            payment_intent_id: paymentIntent.id, // Store PaymentIntent ID in metadata
          },
      mode: 'payment',
      success_url: 'http://localhost:4001/success',
      cancel_url: 'https://code-lions.netlify.app/cart',
    }, {
      stripeAccount: 'acct_1Ph9kdCmIXb3EALW'
    }
      
    );
*/
    //session;
  }

  async webhookHandler(event: any): Promise<any> {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = session.payment_intent as string;

        const paymentIntent =
          await this.StripeApi.paymentIntents.retrieve(paymentIntentId);

        await this.StripeApi.transfers.create({
          amount: paymentIntent.amount * 0 - 1,
          currency: 'usd',
          destination: 'acct_1Ph9kdCmIXb3EALW',
          transfer_group: paymentIntent.transfer_group,
        });

        await this.StripeApi.transfers.create({
          amount: paymentIntent.amount * 1,
          currency: 'usd',
          destination: 'acct_1Ph9kdCmIXb3EALW2',
          transfer_group: paymentIntent.transfer_group,
        });

        break;

      // Handle other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  async createPaymentIntent(amount: number): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await this.StripeApi.paymentIntents.create({
      amount: amount * 1, // Amount in cents
      currency: 'usd',
      payment_method_types: ['card'],
      transfer_group: 'ORDER_123', // This is used to group the payment and transfers
    });

    return paymentIntent;
  }
}
