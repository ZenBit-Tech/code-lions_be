import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { PRODUCTS_ON_PAGE, DAYS_JUST_IN } from 'src/config';
import { Cart } from 'src/modules/cart/cart.entity';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { ProductsAndCountResponseDTO } from 'src/modules/products/dto/products-count-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/user.entity';
import { Wishlist } from 'src/modules/wishlist/wishlist.entity';

import { Order } from './entities/order.enum';
import { Status } from './entities/product-status.enum';

type DateRange = { lower: Date; upper: Date };

interface GetProductsOptions {
  where?: {
    key: keyof Product;
    value: string | DateRange;
  };
  search?: string;
  page?: number;
  limit?: number;
  order?: Order;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
  ): Promise<ProductsAndCountResponseDTO> {
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
  ): Promise<ProductsAndCountResponseDTO> {
    try {
      const vendor = await this.userRepository.findOne({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      const productsByVendorId = await this.getProducts({
        page,
        limit,
        search,
        order,
        where: { key: 'vendorId', value: vendorId },
      });

      return productsByVendorId;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_FETCH_PRODUCTS_BY_VENDOR,
      );
    }
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
    const product = await this.getProducts({
      where: {
        key: 'id',
        value: id,
      },
    });

    if (product.count === 0) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    return product.products[0];
  }

  async findLatest(): Promise<ProductsAndCountResponseDTO> {
    const today = new Date();
    const someDaysAgo = new Date();

    someDaysAgo.setDate(today.getDate() - DAYS_JUST_IN);

    const products = await this.getProducts({
      where: {
        key: 'createdAt',
        value: {
          lower: someDaysAgo,
          upper: today,
        },
      },
    });

    if (products.count === 0) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    return products;
  }

  async findBySize(
    clothesSize: string,
    jeansSize: string,
    shoesSize: string,
  ): Promise<ProductsAndCountResponseDTO> {
    const productsClothes = await this.getProducts({
      where: {
        key: 'size',
        value: clothesSize,
      },
    });

    const productsJeans = await this.getProducts({
      where: {
        key: 'size',
        value: jeansSize,
      },
    });

    const productsShoes = await this.getProducts({
      where: {
        key: 'size',
        value: shoesSize,
      },
    });

    const products = [
      ...productsClothes.products,
      ...productsJeans.products,
      ...productsShoes.products,
    ];

    if (products.length === 0) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    return { products, count: products.length };
  }

  private async getProducts(
    options?: GetProductsOptions,
  ): Promise<ProductsAndCountResponseDTO> {
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
          'product.status',
          'product.size',
          'product.createdAt',
          'product.lastUpdatedAt',
          'product.deletedAt',
          'images',
          'user.id',
          'user.name',
          'user.photoUrl',
          'colors',
        ]);

      if (options?.where) {
        if (options.where.key === 'createdAt') {
          const dateRange = options.where.value as DateRange;

          queryBuilder.where(
            `product.${options.where.key} BETWEEN :startDate AND :endDate`,
            {
              startDate: dateRange.lower,
              endDate: dateRange.upper,
            },
          );
        } else {
          queryBuilder
            .andWhere(`product.${options.where.key} = :${options.where.key}`)
            .setParameter(options.where.key, options.where.value);
        }
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

      const [products, count] = await queryBuilder.getManyAndCount();

      const mappedProducts = this.mapProducts(products);

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

  async deleteProduct(vendorId: string, productId: string): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId, vendorId },
      });

      let deleteResponse;

      if (product.status === Status.INACTIVE) {
        deleteResponse = await this.productRepository.delete(productId);
      } else if (product.status === Status.PUBLISHED) {
        deleteResponse = await this.productRepository.softDelete(productId);
        await this.cartRepository.delete({ productId });
        await this.wishlistRepository.delete({ productId });
      }

      if (!deleteResponse || !deleteResponse.affected) {
        throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(Errors.FAILED_TO_DELETE_PRODUCT);
    }
  }
}
