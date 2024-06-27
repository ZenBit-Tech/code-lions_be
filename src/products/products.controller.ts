import { Controller, Get } from '@nestjs/common';

import { Product } from 'src/products/entities/product.entity';
import { ProductsService } from 'src/products/products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }
}
