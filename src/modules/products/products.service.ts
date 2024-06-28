import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Errors } from 'src/common/errors';
import { Product } from 'src/modules/products/entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    try {
      const products = await this.productRepository
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.user', 'u')
        .leftJoinAndSelect('p.color', 'c')
        .select([
          'p.*',
          'u.name as vendorName',
          'GROUP_CONCAT(c.color) AS colors',
        ])
        .groupBy('p.id')
        .getRawMany();

      return products;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_PRODUCTS);
    }
  }
}
