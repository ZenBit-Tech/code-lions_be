import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import axios from 'axios';
import { Observable, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Errors } from 'src/common/errors';

export interface FileUploadRequest extends Request {
  uploadedFileUrl?: string;
  uploadError?: HttpException;
}

export interface FileUploadOptions {
  allowedFileTypes: string[];
  maxFilesize: number;
  fileUploadUrl?: string;
}

@Injectable()
export abstract class FileUploadInterceptor implements NestInterceptor {
  protected abstract allowedFileTypes: string[];
  protected abstract maxFilesize: number;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const configService = new ConfigService();
    const fileUploadUrl = configService.get<string>('FILE_UPLOAD_URL');

    const request = context.switchToHttp().getRequest<FileUploadRequest>();

    if (!fileUploadUrl) {
      request.uploadError = new InternalServerErrorException(
        Errors.FILE_UPLOAD_URL_NOT_CONFIGURED,
      );

      return next.handle();
    }

    if (request.file) {
      const file = request.file;
      const allowedFileTypesRegex = new RegExp(
        this.allowedFileTypes.join('|') + '$',
        'i',
      );

      if (!file.originalname.match(allowedFileTypesRegex)) {
        request.uploadError = new BadRequestException(
          Errors.ONLY_THIS_FILES_ARE_ALLOWED + this.allowedFileTypes.join(', '),
        );

        return next.handle();
      }
      if (file.size > this.maxFilesize) {
        request.uploadError = new BadRequestException(
          Errors.BIG_FILE + this.maxFilesize,
        );

        return next.handle();
      }

      const formData = new FormData();

      formData.append(
        'file',
        new File([file.buffer], file.originalname, { type: file.mimetype }),
        file.originalname,
      );

      return from(
        axios.post(fileUploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
      ).pipe(
        switchMap((result) => {
          request.uploadedFileUrl = result.data.file;

          return next.handle();
        }),
        catchError((error) => {
          request.uploadError = error;

          return next.handle();
        }),
      );
    } else {
      request.uploadError = new BadRequestException('No file found');

      return next.handle();
    }
  }
}
