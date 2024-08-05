import {
  Body,
  Controller,
  Post,
  Req,
  RawBodyRequest,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Request } from 'express';
import { Errors } from 'src/common/errors';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { AccountLinkResponseDto } from 'src/modules/stripe/dto/account-link-response.dto';
import { PaymentDto } from 'src/modules/stripe/dto/payment.dto';
import { StripeService } from 'src/modules/stripe/stripe.service';
import Stripe from 'stripe';

import { Role } from '../roles/role.enum';
import { Roles } from '../roles/roles.decorator';
import { User } from '../users/user.entity';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  async createCheckoutSession(
    @Body() payment: PaymentDto,
    @Req() request: { user: User },
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const session = await this.stripeService.createCheckoutSession(
      request.user.id,
      payment,
    );

    return session;
  }

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody;
    const sig = req.headers['stripe-signature'];
    const checkedEvent = await this.stripeService.checkSignature(rawBody, sig);

    return await this.stripeService.webhookHandler(checkedEvent);
  }

  @Post('create-account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create stripe connected account',
    tags: ['Stripe'],
    description:
      'Create stripe connected account and returns account onboarding link',
  })
  @ApiCreatedResponse({
    description: 'Created stripe connected account',
    type: AccountLinkResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: {
          type: 'string',
          example: Errors.USER_UNAUTHORIZED,
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Not found user with given id',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.USER_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create account in Stripe',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_CREATE_ACCOUNT,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.VENDOR)
  async createAccount(
    @Req() request: { user: User },
  ): Promise<{ url: string }> {
    const userId = request.user.id;
    const stripeAccountId = await this.stripeService.createAccount(userId);
    const accountLink =
      await this.stripeService.createAccountLink(stripeAccountId);
    const { url } = accountLink;

    return { url };
  }
}
