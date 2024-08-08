import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailerModule } from 'src/modules/mailer/mailer.module';
import { Product } from 'src/modules/products/entities/product.entity';
import { ProductsModule } from 'src/modules/products/products.module';

import { BestVendorsController } from './best-vendors.controller';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product]),
    MailerModule,
    ProductsModule,
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
  controllers: [UsersController, BestVendorsController, FollowController],
  providers: [UsersService, FollowService],
  exports: [UsersService, FollowService],
})
export class UsersModule {}
