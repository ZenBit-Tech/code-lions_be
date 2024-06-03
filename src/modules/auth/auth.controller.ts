import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { ErrorResponse } from 'src/common/error-response';
import { Errors } from 'src/common/errors';
import { responseDescrptions } from 'src/common/response-descriptions';
import { CreateUserDto } from 'src/modules/users/dto/create.dto';
import { PublicUserDto } from 'src/modules/users/dto/public-user.dto';

import { AuthService } from './auth.service';
import { TokensDto } from './dto/tokens.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

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
    type: PublicUserDto,
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
  async register(@Body() dto: CreateUserDto): Promise<PublicUserDto> {
    const user = await this.authService.register(dto);

    return user;
  }

  @Post('verify-otp')
  @ApiOkResponse({
    status: 200,
    description: 'OTP verified successfully, return access and refresh tokens',
    type: TokensDto,
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
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<TokensDto> {
    const tokens = await this.authService.verifyOtp(dto);

    return tokens;
  }
}
