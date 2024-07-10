import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { PRODUCTS_ON_PAGE } from 'src/config';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';

interface GetProductsOptions {
  where?: {
    key: keyof Product;
    value: string;
  };
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  style?: string;
  size?: string;
}

export interface ProductsResponse {
  products: ProductResponseDTO[];
  count: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    minPrice: number,
    maxPrice: number,
    color: string,
    style: string,
    size: string,
  ): Promise<ProductsResponse> {
    return this.getProducts({
      page,
      limit,
      search,
      minPrice,
      maxPrice,
      color,
      style,
      size,
    });
  }

  async findBySlug(slug: string): Promise<ProductResponseDTO> {
    const products = await this.getProducts({
      where: {
        key: 'slug',
        value: slug,
      },
    });

    if (products.count === 0) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    return products.products[0];
  }

  private async getProducts(
    options?: GetProductsOptions,
  ): Promise<ProductsResponse> {
    try {
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.user', 'user')
        .leftJoinAndSelect('product.color', 'colors')
        .select([
          'product.id',
          'product.name',
          'product.slug',
          'product.price',
          'product.description',
          'product.vendorId',
          'product.categories',
          'product.style',
          'product.type',
          'product.size',
          'product.createdAt',
          'product.lastUpdatedAt',
          'images',
          'user.id',
          'user.name',
          'user.photoUrl',
          'colors',
        ]);

      if (options?.where) {
        queryBuilder
          .andWhere(`product.${options.where.key} = :${options.where.key}`)
          .setParameter(options.where.key, options.where.value);
      }

      if (options?.search) {
        queryBuilder.andWhere(
          '(product.name LIKE :search OR product.description LIKE :search OR product.type LIKE :search)',
          { search: `%${options.search}%` },
        );
      }

      if (options?.minPrice) {
        queryBuilder.andWhere('product.price >= :minPrice', {
          minPrice: options.minPrice,
        });
      }

      if (options?.maxPrice) {
        queryBuilder.andWhere('product.price <= :maxPrice', {
          maxPrice: options.maxPrice,
        });
      }

      if (options?.style) {
        queryBuilder.andWhere('product.style = :style', {
          style: options.style,
        });
      }

      if (options?.size) {
        queryBuilder.andWhere('product.size = :size', { size: options.size });
      }

      if (options?.color) {
        queryBuilder.andWhere('colors.color = :color', {
          color: options.color,
        });
      }

      const page = options?.page || 1;
      const limit = options?.limit || PRODUCTS_ON_PAGE;
      const offset = (page - 1) * limit;

      queryBuilder.skip(offset).take(limit);

      const [products, count] = await queryBuilder.getManyAndCount();

      return {
        products: this.mapProducts(products),
        count: count,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_PRODUCTS);
    }
  }

  private mapProducts(products: Product[]): ProductResponseDTO[] {
    const mappedProducts: ProductResponseDTO[] = products.map((product) => {
      const imageUrls = product.images.map((image) => image.url).sort();

      const vendor = {
        id: product.user?.id || '',
        name: product.user?.name || '',
        photoUrl: product.user?.photoUrl || '',
      };
      const colors = product.color;

      delete product.user;
      delete product.vendorId;
      delete product.color;

      return {
        ...product,
        images: imageUrls,
        colors: colors,
        vendor: vendor,
      };
    });

    return mappedProducts;
  }
}
