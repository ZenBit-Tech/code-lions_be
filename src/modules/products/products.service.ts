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
      const rawProducts = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.user', 'user')
        .leftJoinAndSelect('product.color', 'colors')
        .getRawMany();

      const products = rawProducts.reduce((acc, row) => {
        const productId = row.product_id;

        if (!acc[productId]) {
          acc[productId] = {
            id: row.product_id,
            name: row.product_name,
            slug: row.product_slug,
            price: row.product_price,
            description: row.product_description,
            categories: row.product_categories.split(','),
            style: row.product_style,
            type: row.product_type,
            size: row.product_size,
            images: [],
            colors: [],
            vendor: {
              id: row.user_id,
              name: row.user_name,
              photoUrl: row.user_photoUrl,
            },
            createdAt: row.product_createdAt,
            lastUpdatedAt: row.product_lastUpdatedAt,
          };
        }

        if (row.images_id && !acc[productId].images.includes(row.images_url)) {
          acc[productId].images.push(row.images_url);
        }

        if (
          row.colors_color &&
          !acc[productId].colors.includes(row.colors_color)
        ) {
          acc[productId].colors.push(row.colors_color);
        }

        return acc;
      }, {});

      return Object.values(products);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_PRODUCTS);
    }
  }
}
