import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';

import { CartController } from './cart.controller';
import { Cart } from './cart.entity';
import { CartService } from './cart.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, User, Product])],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
