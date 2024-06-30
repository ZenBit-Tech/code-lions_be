import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmConfigService } from 'src/config/typeorm';
import { AuthModule } from 'src/modules/auth/auth.module';
import { GeoNamesModule } from 'src/modules/geoNames/geoNames.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { ReviewsModule } from 'src/modules/reviews/reviews.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    UsersModule,
    AuthModule,
    GeoNamesModule,
    ReviewsModule,
    ProductsModule,
  ],
})
export class AppModule {}
