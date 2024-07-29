import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailerModule } from 'src/modules/mailer/mailer.module';

import { Product } from '../products/entities/product.entity';

import { BestVendorsController } from './best-vendors.controller';
import { VendorsController } from './follow-vendors.controller';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product]),
    MailerModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: configService.get<string>('TOKEN_EXPIRE_TIME'),
        },
      }),
    }),
  ],
  controllers: [UsersController, BestVendorsController, VendorsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
