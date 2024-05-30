import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';

@Catch(HttpException, ValidationError)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | ValidationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : this.getValidationErrorMessage(exception);

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getValidationErrorMessage(exception: ValidationError): string {
    const errorMessage = Object.values(exception.constraints).join(', ');

    return errorMessage || 'Validation error occurred';
  }
}
