import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { Errors } from 'src/common/errors';
import { CANADA_POST_LOGO } from 'src/config';
import { CartService } from 'src/modules/cart/cart.service';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { OrdersService } from 'src/modules/orders/orders.service';
import { ProductsService } from 'src/modules/products/products.service';
import { UsersService } from 'src/modules/users/users.service';

import { PaymentDto } from './dto/payment.dto';
import { StripeModuleOptions } from './stripe.interfaces';
import { MODULE_OPTIONS_TOKEN } from './stripe.module-definition';

const minDifference = 0.01;
const centsInDollar = 100;
const successStatus = 'succeeded';

@Injectable()
export class StripeService {
  public readonly StripeApi: Stripe;
  private readonly Logger = new Logger(StripeService.name);

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private options: StripeModuleOptions,
    private usersServise: UsersService,
    private productsService: ProductsService,
    private configService: ConfigService,
    private cartService: CartService,
    private ordersService: OrdersService,
    private mailerService: MailerService,
  ) {
    this.StripeApi = new Stripe(this.options.apiKey, this.options.options);
  }

  async createCheckoutSession(
    customerId: string,
    payment: PaymentDto,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const { productIds, total, shippingPrice } = payment;

    try {
      const user = await this.usersServise.getUserById(customerId);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const products = await this.productsService.findByIds(productIds);

      if (products.length < productIds.length) {
        throw new NotFoundException(Errors.SOME_PRODUCTS_NOT_FOUND);
      }

      const productsTotalPrice = products.reduce(
        (sum, product) => sum + Number(product.price),
        0,
      );

      if (
        Math.abs(productsTotalPrice + shippingPrice - total) > minDifference
      ) {
        throw new ConflictException(Errors.PRICES_DO_NOT_MATCH);
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
        products.map((product) => {
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                images: [product.images[0]],
              },
              unit_amount: Math.round(Number(product.price) * centsInDollar),
            },
            quantity: 1,
          };
        });

      if (shippingPrice > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping',
              images: [CANADA_POST_LOGO],
            },
            unit_amount: Math.round(shippingPrice * centsInDollar),
          },
          quantity: 1,
        });
      }

      const session = await this.StripeApi.checkout.sessions.create({
        line_items: lineItems,
        metadata: {
          userId: customerId,
          shippingPrice: shippingPrice,
        },
        payment_intent_data: {
          capture_method: 'manual',
        },
        mode: 'payment',
        success_url: this.configService.get<string>('STRIPE_SUCCESS_URL'),
        cancel_url: this.configService.get<string>('STRIPE_CANCEL_URL'),
      });

      return session;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.Logger.error(error);
      throw new InternalServerErrorException(Errors.PAYMENT_ERROR);
    }
  }

  async captureMoney(
    paymentIntentId: string,
    amount: number,
  ): Promise<boolean> {
    try {
      const intent = await this.StripeApi.paymentIntents.capture(
        paymentIntentId,
        {
          amount_to_capture: Math.round(amount * centsInDollar),
        },
      );

      if (intent.status !== successStatus) {
        throw new Error('Payment intent status is not succeeded');
      }

      return true;
    } catch (error) {
      this.Logger.error(error);
      this.Logger.error(
        `Payment Intent ID: ${paymentIntentId}, amount: $${amount}`,
      );

      const parameters = JSON.stringify({
        paymentIntentId,
        amount,
      });

      this.sendErrorMail('captureMoney', parameters, error);

      return false;
    }
  }

  async returnMoney(paymentIntentId: string): Promise<boolean> {
    try {
      await this.StripeApi.paymentIntents.cancel(paymentIntentId);

      return true;
    } catch (error) {
      this.Logger.error(error);
      this.Logger.error(`Payment Intent ID: ${paymentIntentId}`);

      this.sendErrorMail('returnMoney', paymentIntentId, error);

      return false;
    }
  }

  async webhookHandler(event: Stripe.Event): Promise<{ received: boolean }> {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId = session.payment_intent as string;

      const paymentIntent =
        await this.StripeApi.paymentIntents.retrieve(paymentIntentId);
      const metadata = session.metadata;

      console.log(paymentIntent);
      const { id: paymentId, amount_capturable: total, status } = paymentIntent;
      const { userId, shippingPrice } = metadata;

      const totalAmount = total / centsInDollar;
      const isPaid = status === successStatus;

      this.Logger.log(
        `User: ${userId}, shipping: ${Number(shippingPrice)}, total: ${totalAmount}, isPaid: ${isPaid}, paymentId: ${paymentId}`,
      );

      await this.ordersService.createOrdersForUser(
        userId,
        Number(shippingPrice),
        totalAmount,
        isPaid,
        paymentId,
      );
      await this.cartService.emptyCart(userId);
    } else if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;

      if (account.charges_enabled) {
        const user = await this.usersServise.getUserByStripeAccount(account.id);

        if (user) {
          await this.usersServise.fihishOnboarding(user.id);
        }
        this.Logger.log(`Account onboarded: ${account.email}`);
      }
    }

    return { received: true };
  }

  async checkSignature(
    raw: Buffer | string,
    signature: string | string[],
  ): Promise<Stripe.Event> {
    try {
      const consrtuctedEvent = this.StripeApi.webhooks.constructEvent(
        raw,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
      );

      return consrtuctedEvent;
    } catch (error) {
      this.Logger.error(error);
      throw new BadRequestException(Errors.INVALID_WEBHOOK_SIGNATURE);
    }
  }

  async createAccount(userId: string): Promise<string> {
    try {
      const user = await this.usersServise.getUserById(userId);

      if (!user) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }
      if (user.stripeAccount) {
        return user.stripeAccount;
      }
      const account = await this.StripeApi.accounts.create({
        country: 'CA',
        email: user.email,

        controller: {
          fees: { payer: 'application' },
          losses: { payments: 'application' },
          stripe_dashboard: { type: 'express' },
        },
      });

      await this.usersServise.updateUserStripeAccount(userId, account.id);

      return account.id;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_CREATE_ACCOUNT);
    }
  }

  async createAccountLink(
    accountId: string,
  ): Promise<Stripe.Response<Stripe.AccountLink>> {
    return this.StripeApi.accountLinks.create({
      account: accountId,
      refresh_url: this.configService.get<string>('STRIPE_REFRESH_URL'),
      return_url: this.configService.get<string>('STRIPE_RETURN_URL'),
      type: 'account_onboarding',
    });
  }

  private async sendErrorMail(
    action: string,
    parameters: string,
    error: unknown,
  ): Promise<void> {
    await this.mailerService.sendMail({
      receiverEmail: this.configService.get<string>('STRIPE_PROBLEMS_EMAIL'),
      subject: 'Stripe money capture problem',
      templateName: 'stripe-error.hbs',
      context: {
        action: 'captureMoney',
        parameters: parameters,
        error: JSON.stringify(error),
        date: new Date(),
      },
    });
  }
}
