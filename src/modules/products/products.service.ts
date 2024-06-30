import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Errors } from 'src/common/errors';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { Repository } from 'typeorm';

interface GetProductsOptions {
  where?: {
    key: keyof Product;
    value: string;
  };
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<ProductResponseDTO[]> {
    return this.getProducts();
  }

  async findBySlug(slug: string): Promise<ProductResponseDTO> {
    const products = await this.getProducts({
      where: {
        key: 'slug',
        value: slug,
      },
    });

    if (products.length === 0) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    return products[0];
  }

  private async getProducts(
    options?: GetProductsOptions,
  ): Promise<ProductResponseDTO[]> {
    try {
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.user', 'user')
        .leftJoinAndSelect('product.color', 'colors');

      if (options?.where) {
        queryBuilder
          .where(`product.${options.where.key} = :${options.where.key}`)
          .setParameter(options.where.key, options.where.value);
      }

      const rawProducts = await queryBuilder.getRawMany();

      return this.groupProducts(rawProducts);
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_PRODUCTS);
    }
  }

  private groupProducts(rawProducts: any[]): ProductResponseDTO[] {
    const groupedProducts = rawProducts.reduce((acc, row) => {
      const productId = row.product_id;

      if (!acc[productId]) {
        acc[productId] = {
          id: row.product_id,
          name: row.product_name,
          slug: row.product_slug,
          price: row.product_price,
          description: row.product_description,
          categories: row.product_categories
            ? row.product_categories.split(',')
            : [],
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

    return Object.values(groupedProducts);
  }
}
