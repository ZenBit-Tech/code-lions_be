import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import { UserResponseDto } from 'src/modules/auth/dto/user-response.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';

import { JwtAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { EmailDto } from './dto/email.dto';
import { GooglePayloadDto } from './dto/google-payload.dto';
import { IdDto } from './dto/id.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordDto } from './dto/password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetOtpDto } from './dto/reset-otp';
import { UserWithTokensResponseDto } from './dto/user-with-tokens-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GoogleAuthGuard } from './google-auth.guard';

@ApiTags('auth')
@Controller('auth')
@ApiInternalServerErrorResponse({
  description: responseDescrptions.error,
  type: ErrorResponse,
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    tags: ['Auth Endpoints'],
    description:
      'This endpoint registers a new user in the database and returns an object with the new user.',
  })
  @ApiCreatedResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body is not valid',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string[]',
          example: [Errors.NAME_IS_STRING],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'User already exists in the database',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: {
          type: 'string',
          example: Errors.USER_EXISTS,
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Service is unavailable',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 503 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SEND_VERIFICATION_EMAIL,
        },
        error: { type: 'string', example: 'Service Unavailable' },
      },
    },
  })
  @ApiBody({ type: CreateUserDto })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.authService.register(createUserDto);

    return user;
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify user`s email and generate access and refresh tokens',
    tags: ['Auth Endpoints'],
    description:
      'This endpoint verifies the OTP and returns an object with access and refresh tokens.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OTP verified successfully, return access and refresh tokens',
    type: UserWithTokensResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body is not valid',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string[]',
          example: [
            Errors.INVALID_USER_ID,
            Errors.DIGITS_ONLY,
            Errors.CODE_LENGTH,
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiUnprocessableEntityResponse({
    description: 'Invalid or expired OTP',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 422 },
        message: {
          type: 'string',
          example: Errors.WRONG_CODE,
        },
        error: { type: 'string', example: 'Unprocessable Entity' },
      },
    },
  })
  @ApiBody({ type: VerifyOtpDto })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<UserWithTokensResponseDto> {
    const userWithTokens = await this.authService.verifyOtp(verifyOtpDto);

    return userWithTokens;
  }

  @Post('resend-otp')
  @ApiOperation({
    summary: 'Resend OTP for user email verification',
    tags: ['Auth Endpoints'],
    description: 'This endpoint resends the OTP.',
  })
  @ApiNoContentResponse({
    status: 204,
    description: 'OTP resent successfully',
  })
  @ApiBadRequestResponse({
    description: 'User email has already been verified',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string',
          example: Errors.EMAIL_ALREADY_VERIFIED,
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiServiceUnavailableResponse({
    description: 'Service is unavailable',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 503 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SEND_VERIFICATION_EMAIL,
        },
        error: { type: 'string', example: 'Service Unavailable' },
      },
    },
  })
  @ApiBody({ type: IdDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendOtp(@Body() idDto: IdDto): Promise<void> {
    await this.authService.resendOtp(idDto.id);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    tags: ['Auth Endpoints'],
    description:
      'This endpoint logs in the user and returns an object with access and refresh tokens or without them.',
  })
  @ApiOkResponse({
    status: 200,
    description:
      'Login successful, return user with or without access and refresh tokens',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UserResponseDto) },
        { $ref: getSchemaPath(UserWithTokensResponseDto) },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Request body is not valid or user credentials are invalid',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string | string[]',
          example: Errors.INVALID_CREDENTIALS,
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<UserResponseDto | UserWithTokensResponseDto> {
    const user = await this.authService.login(loginDto);

    if (!user.isEmailVerified) {
      return user;
    }

    return this.authService.generateUserWithTokensResponseDto(user);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Send email to reset password',
    tags: ['Auth Endpoints'],
    description: 'This endpoint sends an email with a otp to reset password.',
  })
  @ApiNoContentResponse({
    status: 204,
    description: 'Email sent successfully',
  })
  @ApiBadRequestResponse({
    description: 'Request body is not valid',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string[]',
          example: [Errors.INVALID_EMAIL],
        },
        error: { type: 'string', example: 'Bad Request' },
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
  @ApiServiceUnavailableResponse({
    description: 'Service is unavailable',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 503 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_SEND_FORGET_PASSWORD_EMAIL,
        },
        error: { type: 'string', example: 'Service Unavailable' },
      },
    },
  })
  @ApiBody({ type: EmailDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() emailDto: EmailDto): Promise<void> {
    await this.authService.sendResetPasswordEmail(emailDto.email);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    tags: ['Auth Endpoints'],
    description: 'This endpoint resets password if otp is valid.',
  })
  @ApiOkResponse({
    status: 200,
    description:
      'Password reset successfully, return user with access and refresh tokens',
    type: UserWithTokensResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body is not valid or otp is invalid',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string[]',
          example: [Errors.INVALID_EMAIL, Errors.CODE_LENGTH],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Not found user with given email',
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
  @ApiUnprocessableEntityResponse({
    description: 'Invalid or expired OTP',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 422 },
        message: {
          type: 'string',
          example: Errors.WRONG_CODE,
        },
        error: { type: 'string', example: 'Unprocessable Entity' },
      },
    },
  })
  @ApiBody({ type: ResetOtpDto })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetOtpDto: ResetOtpDto,
  ): Promise<UserWithTokensResponseDto> {
    const userWithTokens = await this.authService.resetPassword(resetOtpDto);

    return userWithTokens;
  }

  @Post('new-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Change password upon successful otp verification',
    tags: ['Auth Endpoints'],
    description: 'This endpoint changes password if otp is valid.',
  })
  @ApiNoContentResponse({
    status: 204,
    description: 'Password changed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or short password',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string[]',
          example: [Errors.PASSWORD_LENGTH, Errors.PASSWORD_IS_STRING],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - No token or invalid token or expired token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: {
          type: 'string',
          example: Errors.INVALID_TOKEN,
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to change password',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: Errors.FAILED_TO_CHANGE_PASSWORD,
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: PasswordDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Request() request: Request & { user: UserResponseDto },
    @Body() passwordDto: PasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(
      request.user.id,
      passwordDto.password,
    );
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh token',
    tags: ['Auth Endpoints'],
    description:
      'Get refresh token and return user with access and refresh tokens',
  })
  @ApiOkResponse({
    description: 'Return user with access and refresh tokens',
    type: UserWithTokensResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid refresh token',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string[]',
          example: [Errors.REFRESH_TOKEN_SHOULD_BE_JWT],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiBody({ type: RefreshTokenDto })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<UserWithTokensResponseDto> {
    const user = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );

    return user;
  }

  @Post('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Authenticate user via Google',
    tags: ['Auth Endpoints'],
    description:
      'This endpoint creates or signs in a user via Google and returns an object with access and refresh tokens if the email is verified, or just the public user details if not.',
  })
  @ApiCreatedResponse({
    status: 201,
    description: 'User created successfully via Google',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UserResponseDto) },
        { $ref: getSchemaPath(UserWithTokensResponseDto) },
      ],
    },
  })
  @ApiOkResponse({
    status: 200,
    description: 'User signed in successfully via Google',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UserResponseDto) },
        { $ref: getSchemaPath(UserWithTokensResponseDto) },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid Google token or payload',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          type: 'string | string[]',
          example: 'Invalid Google token payload',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      properties: {
        statusCode: { type: 'integer', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to authenticate user via Google',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({
    schema: {
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  async authenticateViaGoogle(
    @Request() request: Request & { googlePayload: GooglePayloadDto },
  ): Promise<UserWithTokensResponseDto | UserResponseDto> {
    const userViaGoogle = await this.authService.authenticateViaGoogle(
      request.googlePayload,
    );

    if (!userViaGoogle.isEmailVerified) {
      return userViaGoogle;
    }

    return this.authService.generateUserWithTokensResponseDto(userViaGoogle);
  }
}
