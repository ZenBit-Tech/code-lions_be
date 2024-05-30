import * as fs from 'node:fs/promises';
import * as path from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import Handlebars from 'handlebars';
import {
  createTransport,
  SendMailOptions,
  Transporter,
  TransportOptions,
} from 'nodemailer';

import { emailTemplatePath } from './mailer.config';
import { SendMailArgs } from './mailer.types';

@Injectable()
export class MailerService {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
      dkim: {
        domainName: this.configService.get<string>('DKIM_DOMAIN'),
        keySelector: this.configService.get<string>('DKIM_SELECTOR'),
        privateKey: this.configService.get<string>('DKIM_PRIVATE_KEY'),
      },
    } as TransportOptions);
  }

  async sendMail(sendMailArgs: SendMailArgs): Promise<boolean> {
    const { receiverEmail, subject, templateName, context } = sendMailArgs;

    if (!receiverEmail || !subject || !templateName || !context) {
      return false;
    }

    try {
      const absoluteTemplatePath = path.join(
        __dirname,
        emailTemplatePath,
        templateName,
      );
      const template = await fs.readFile(absoluteTemplatePath, 'utf-8');
      const letterHtml = Handlebars.compile(template, {
        strict: true,
      })(context);

      const mailOptions: SendMailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: receiverEmail,
        subject: subject,
        html: letterHtml,
      };

      await this.transporter.sendMail(mailOptions);

      return true;
    } catch (error) {
      return false;
    }
  }
}
