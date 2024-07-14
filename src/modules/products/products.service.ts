import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { PRODUCTS_ON_PAGE } from 'src/config';
import { ProductResponseWithStatusDto } from 'src/modules/products/dto/product-response-with-status.dto';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';

import { Order } from './entities/order.enum';
import { Status } from './entities/product-status.enum';

interface GetProductsOptions {
  where?: {
    key: keyof Product;
    value: string;
  };
  search?: string;
  page?: number;
  limit?: number;
  order?: Order;
}

export interface ProductsResponse {
  products: ProductResponseDTO[];
  count: number;
}

export interface ProductsWithStatusResponse {
  products: ProductResponseWithStatusDto[];
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
  ): Promise<ProductsResponse> {
    return this.getProducts({
      page,
      limit,
      search,
      where: { key: 'status', value: Status.PUBLISHED },
    });
  }

  async findByVendorId(
    page: number,
    limit: number,
    search: string,
    order: Order,
    vendorId: string,
  ): Promise<ProductsWithStatusResponse> {
    const productsResponse = await this.getProducts({
      page,
      limit,
      search,
      order,
      where: { key: 'vendorId', value: vendorId },
    });

    const productsWithStatus = await Promise.all(
      productsResponse.products.map(async (product) => {
        const productWithStatus = await this.productRepository.findOne({
          select: ['status'],
          where: { id: product.id },
        });

        return {
          ...product,
          status: productWithStatus?.status,
        };
      }),
    );

    return {
      products: productsWithStatus,
      count: productsResponse.count,
    };
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

  async findById(id: string): Promise<ProductResponseDTO> {
    const products = await this.getProducts({
      where: {
        key: 'id',
        value: id,
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
          'product.name LIKE :search OR product.description LIKE :search OR product.type LIKE :search',
          { search: `%${options.search}%` },
        );
      }

      if (options?.order) {
        queryBuilder.orderBy(
          'product.createdAt',
          options.order === Order.ASC ? 'ASC' : 'DESC',
        );
      }

      const page = options?.page || 1;
      const limit = options?.limit || PRODUCTS_ON_PAGE;
      const offset = (page - 1) * limit;

      queryBuilder.skip(offset).take(limit);

      const [products] = await queryBuilder.getManyAndCount();

      const mappedProducts = this.mapProducts(products);
      const count = mappedProducts.length;

      return {
        products: mappedProducts,
        count: count,
      };
    } catch (error) {
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
