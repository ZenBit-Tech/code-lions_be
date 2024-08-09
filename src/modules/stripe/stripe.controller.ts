import {
  Body,
  Controller,
  Post,
  Req,
  RawBodyRequest,
  UseGuards,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';

import { Errors } from 'src/common/errors';
import { JwtAuthGuard } from 'src/modules/auth/auth.guard';
import { Role } from 'src/modules/roles/role.enum';
import { Roles } from 'src/modules/roles/roles.decorator';
import { RolesGuard } from 'src/modules/roles/roles.guard';
import { AccountLinkResponseDto } from 'src/modules/stripe/dto/account-link-response.dto';
import { PaymentDto } from 'src/modules/stripe/dto/payment.dto';
import { StripeService } from 'src/modules/stripe/stripe.service';
import { User } from 'src/modules/users/user.entity';

import { UpdateApplicationFeeDto } from './dto/update-application-fee.dto';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create checkout session',
    tags: ['stripe'],
    description:
      'Create checkout session and returns object with session id and link',
  })
  @ApiCreatedResponse({
    description: 'Created checkout session',
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
    description: 'Not found user or not found product with given id',
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
  @ApiConflictResponse({
    description: 'Prices do not match',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: {
          type: 'string',
          example: Errors.PRICES_DO_NOT_MATCH,
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create checkout session',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.PAYMENT_ERROR,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
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

  @Get('application-fee')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get application fee',
    tags: ['stripe'],
    description: 'Get the current application fee.',
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
    description: 'Application fee not found',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.APPLICATION_FEE_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve application fee',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.INTERNAL_SERVER_ERROR,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.ADMIN)
  async getApplicationFee(): Promise<number> {
    return this.stripeService.getApplicationFee();
  }

  @Patch('application-fee')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Update application fee',
    tags: ['stripe'],
    description: 'Update the current application fee.',
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
    description: 'Application fee not found',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: {
          type: 'string',
          example: Errors.APPLICATION_FEE_NOT_FOUND,
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update application fee',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.INTERNAL_SERVER_ERROR,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @Roles(Role.ADMIN)
  async updateApplicationFee(
    @Body() updateApplicationFee: UpdateApplicationFeeDto,
  ): Promise<void> {
    await this.stripeService.updateApplicationFee(
      updateApplicationFee.applicationFee,
    );
  }
}
