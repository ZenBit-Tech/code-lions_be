import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { Product } from 'src/modules/products/entities/product.entity';
import { ProductsService } from 'src/modules/products/products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':slug')
  @ApiParam({
    name: 'slug',
    description: 'The slug of the product',
  })
  async findBySlug(@Param('slug') slug: string): Promise<Product> {
    return this.productsService.findBySlug(slug);
  }
}
