import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from 'src/modules/cart/cart.entity';
import { MailerModule } from 'src/modules/mailer/mailer.module';
import { Color } from 'src/modules/products/entities/color.entity';
import { Image } from 'src/modules/products/entities/image.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { ProductsController } from 'src/modules/products/products.controller';
import { ProductsService } from 'src/modules/products/products.service';
import { User } from 'src/modules/users/user.entity';
import { Wishlist } from 'src/modules/wishlist/wishlist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, User, Color, Cart, Wishlist, Image]),
    MailerModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
