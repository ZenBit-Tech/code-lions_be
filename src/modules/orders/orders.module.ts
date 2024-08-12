import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from 'src/modules/cart/cart.entity';
import { BuyerOrder } from 'src/modules/orders/entities/buyer-order.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { OrdersController } from 'src/modules/orders/orders.controller';
import { OrdersService } from 'src/modules/orders/orders.service';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Product, BuyerOrder, Cart]),
    ScheduleModule.forRoot(),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
