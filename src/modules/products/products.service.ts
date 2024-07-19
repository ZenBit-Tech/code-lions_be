import * as fs from 'fs';

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';

import { Errors } from 'src/common/errors';
import { PRODUCTS_ON_PAGE, DAYS_JUST_IN } from 'src/config';
import { Cart } from 'src/modules/cart/cart.entity';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { ProductsAndCountResponseDTO } from 'src/modules/products/dto/products-count-response.dto';
import { UpdateProductDto } from 'src/modules/products/dto/update-product.dto';
import { Brand } from 'src/modules/products/entities/brands.entity';
import { Color } from 'src/modules/products/entities/color.entity';
import { Image } from 'src/modules/products/entities/image.entity';
import { Status } from 'src/modules/products/entities/product-status.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { Role } from 'src/modules/roles/role.enum';
import { User } from 'src/modules/users/user.entity';
import { Wishlist } from 'src/modules/wishlist/wishlist.entity';
import { v4 as uuidv4 } from 'uuid';

type DateRange = { lower: Date; upper: Date };

interface GetProductsOptions {
  where?: {
    key: keyof Product;
    value: string | DateRange;
  };
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  style?: string;
  size?: string;
  sortBy?: string;
  sortOrder?: string;
  showNotFinished?: boolean;
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    private dataSource: DataSource,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async findAll(
    category: string,
    page: number,
    limit: number,
    search: string,
    minPrice: number,
    maxPrice: number,
    color: string,
    style: string,
    size: string,
    sortBy: string,
    sortOrder: string,
  ): Promise<ProductsResponse> {
    return this.getProducts({
      category,
      page,
      limit,
      search,
      minPrice,
      maxPrice,
      color,
      style,
      size,
      sortBy,
      sortOrder,
      where: { key: 'status', value: Status.PUBLISHED },
    });
  }

  async findByVendorId(
    page: number,
    limit: number,
    search: string,
    sortOrder: string,
    sortBy: string,
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
        sortBy,
        sortOrder,
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

  async findAdminList(
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortOrder: string,
    list?: Status,
  ): Promise<ProductsAndCountResponseDTO> {
    try {
      const productsAdminList = await this.getProducts({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        where: { key: 'status', value: list },
      });

      return productsAdminList;
    } catch (error) {
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_PRODUCTS);
    }
  }

  async approveRequest(productId: string): Promise<void> {
    await this.dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        try {
          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: productId, status: Status.INACTIVE },
          });

          const vendor = await transactionalEntityManager.findOne(User, {
            where: { id: product.vendorId },
          });

          if (!product || !vendor) {
            throw new NotFoundException(Errors.USER_OR_PRODUCT_NOT_FOUND);
          }

          product.status = Status.PUBLISHED;
          await transactionalEntityManager.save(Product, product);

          const isMailSent = await this.mailerService.sendMail({
            receiverEmail: vendor.email,
            subject: 'Product published on CodeLions!',
            templateName: 'approve-product.hbs',
            context: {
              productName: product.name,
            },
          });

          if (!isMailSent) {
            throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
          }
        } catch (error) {
          if (
            error instanceof NotFoundException ||
            error instanceof ServiceUnavailableException
          ) {
            throw error;
          }
          throw new InternalServerErrorException(
            Errors.FAILED_TO_APPROVE_PRODUCT,
          );
        }
      },
    );
  }

  async rejectRequest(productId: string): Promise<void> {
    await this.dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        try {
          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: productId, status: Status.INACTIVE },
          });

          const vendor = await transactionalEntityManager.findOne(User, {
            where: { id: product.vendorId },
          });

          if (!product || !vendor) {
            throw new NotFoundException(Errors.USER_OR_PRODUCT_NOT_FOUND);
          }

          product.status = Status.REJECTED;
          await transactionalEntityManager.save(Product, product);

          const isMailSent = await this.mailerService.sendMail({
            receiverEmail: vendor.email,
            subject: 'Product rejected on CodeLions!',
            templateName: 'reject-product.hbs',
            context: {
              productName: product.name,
            },
          });

          if (!isMailSent) {
            throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
          }
        } catch (error) {
          if (
            error instanceof NotFoundException ||
            error instanceof ServiceUnavailableException
          ) {
            throw error;
          }
          throw new InternalServerErrorException(
            Errors.FAILED_TO_REJECT_PRODUCT,
          );
        }
      },
    );
  }

  async deleteProductByAdmin(productId: string): Promise<void> {
    await this.dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        try {
          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: productId, status: Status.PUBLISHED },
          });

          const vendor = await transactionalEntityManager.findOne(User, {
            where: { id: product.vendorId },
          });

          if (!product || !vendor) {
            throw new NotFoundException(Errors.USER_OR_PRODUCT_NOT_FOUND);
          }

          const deleteResponse = await transactionalEntityManager.softDelete(
            Product,
            productId,
          );

          await transactionalEntityManager.delete(Cart, { productId });
          await transactionalEntityManager.delete(Wishlist, { productId });

          if (!deleteResponse || !deleteResponse.affected) {
            throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
          }

          const isMailSent = await this.mailerService.sendMail({
            receiverEmail: vendor.email,
            subject: 'Product deleted on CodeLions!',
            templateName: 'delete-product-admin.hbs',
            context: {
              productName: product.name,
            },
          });

          if (!isMailSent) {
            throw new ServiceUnavailableException(Errors.FAILED_TO_SEND_EMAIL);
          }
        } catch (error) {
          if (
            error instanceof NotFoundException ||
            error instanceof ServiceUnavailableException
          ) {
            throw error;
          }
          throw new InternalServerErrorException(
            Errors.FAILED_TO_DELETE_PRODUCT,
          );
        }
      },
    );
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
      showNotFinished: true,
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

    const publishedProducts = products.products.filter(
      (item) => item.status === Status.PUBLISHED,
    );

    if (publishedProducts.length === 0) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    return { products: publishedProducts, count: publishedProducts.length };
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

    const publishedProducts = [
      ...productsClothes.products,
      ...productsJeans.products,
      ...productsShoes.products,
    ].filter((item) => item.status === Status.PUBLISHED);

    if (publishedProducts.length === 0) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    return { products: publishedProducts, count: publishedProducts.length };
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
        .leftJoinAndSelect('product.brand', 'brand')
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
          'product.brand',
          'product.material',
          'product.createdAt',
          'product.lastUpdatedAt',
          'product.deletedAt',
          'images',
          'user.id',
          'user.name',
          'user.photoUrl',
          'colors',
          'brand.brand',
        ]);

      if (!options?.showNotFinished) {
        queryBuilder.andWhere(
          'product.isProductCreationFinished = :isProductCreationFinished',
          {
            isProductCreationFinished: true,
          },
        );
      }
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

      if (options?.category) {
        queryBuilder.andWhere('FIND_IN_SET(:category, product.categories)', {
          category: options.category,
        });
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

      if (options?.sortBy && options?.sortOrder) {
        queryBuilder.orderBy(
          `product.${options.sortBy}`,
          options.sortOrder === 'ASC' ? 'ASC' : 'DESC',
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
      console.log(error);
      throw new InternalServerErrorException(Errors.FAILED_TO_FETCH_PRODUCTS);
    }
  }

  mapProducts(products: Product[]): ProductResponseDTO[] {
    const mappedProducts: ProductResponseDTO[] = products.map((product) => {
      const sortedImages = !product?.images
        ? []
        : this.sortImages(product.images);
      const imageUrls = sortedImages.map((image) => image.url);

      const vendor = {
        id: product.user?.id || '',
        name: product.user?.name || '',
        photoUrl: product.user?.photoUrl || '',
      };
      const colors = product.color || [];
      const mappedColors = colors.map((color) => color.color);
      const brand = product?.brand?.brand || '';

      delete product.user;
      delete product.vendorId;
      delete product.color;

      return {
        ...product,
        images: imageUrls,
        colors: mappedColors,
        vendor: vendor,
        brand: brand,
      };
    });

    return mappedProducts;
  }

  async deleteProduct(vendorId: string, productId: string): Promise<void> {
    await this.dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        try {
          const product = await transactionalEntityManager.findOne(Product, {
            where: { id: productId, vendorId },
          });

          if (!product) {
            throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
          }

          let deleteResponse;

          if (product.status === Status.INACTIVE) {
            deleteResponse = await transactionalEntityManager.delete(
              Product,
              productId,
            );
          } else if (product.status === Status.PUBLISHED) {
            deleteResponse = await transactionalEntityManager.softDelete(
              Product,
              productId,
            );
            await transactionalEntityManager.delete(Cart, { productId });
            await transactionalEntityManager.delete(Wishlist, { productId });
          }

          if (!deleteResponse || !deleteResponse.affected) {
            throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
          }
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new InternalServerErrorException(
            Errors.FAILED_TO_DELETE_PRODUCT,
          );
        }
      },
    );
  }

  async updateProductPhoto(
    vendorId: string,
    photoUrl: string,
  ): Promise<ProductResponseDTO> {
    try {
      const vendor = await this.userRepository.findOne({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      if (vendor.role !== Role.VENDOR || vendor.isAccountActive === false) {
        throw new ForbiddenException(
          Errors.UNAUTHORIZED_TO_UPLOAD_PRODUCT_PHOTOS,
        );
      }

      const unfinishedProduct = await this.productRepository.findOne({
        where: { vendorId, isProductCreationFinished: false },
        relations: ['images'],
      });

      let product = unfinishedProduct;
      let isPrimary = !product?.images || product.images.length === 0;

      if (!unfinishedProduct) {
        product = await this.createEmptyProduct(vendorId);
        isPrimary = true;
      }

      const siteHost = this.configService.get<string>('SITE_HOST');

      const image = new Image();

      image.url = photoUrl.replace('./', siteHost);
      image.isPrimary = isPrimary;
      image.product = product;
      await this.imageRepository.save(image);

      const updatedProduct = await this.findById(product.id);

      return updatedProduct;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_UPLOAD_PRODUCT_PHOTO,
      );
    }
  }

  async createEmptyProduct(vendorId: string): Promise<Product> {
    const temporaryName = `Product-${uuidv4()}`;
    const slug = this.generateSlug(temporaryName);

    const product = new Product();

    product.vendorId = vendorId;
    product.name = temporaryName;
    product.slug = slug;
    product.isProductCreationFinished = false;
    product.status = Status.INACTIVE;
    product.lastUpdatedAt = new Date();

    const savedProduct = await this.productRepository.save(product);

    return savedProduct;
  }

  async deleteProductPhoto(
    vendorId: string,
    photoUrl: string,
  ): Promise<ProductResponseDTO> {
    try {
      const vendor = await this.userRepository.findOne({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      if (vendor.role !== Role.VENDOR || vendor.isAccountActive === false) {
        throw new ForbiddenException(Errors.FORBIDDEN_TO_DELETE_PRODUCT_PHOTOS);
      }

      const photo = await this.imageRepository.findOne({
        where: { url: photoUrl },
        relations: { product: true },
      });

      if (!photo) {
        throw new NotFoundException(Errors.IMAGE_NOT_FOUND);
      }

      if (photo.product.vendorId !== vendorId) {
        throw new ForbiddenException(
          Errors.FORBIDDEN_TO_DELETE_PRODUCT_PHOTOS_FROM_OTHER_VENDORS,
        );
      }

      await this.imageRepository.remove(photo);

      const siteHost = this.configService.get<string>('SITE_HOST');
      const filePath = photoUrl.replace(siteHost, './');

      fs.unlinkSync(filePath);

      if (photo.isPrimary) {
        const anotherPhoto = await this.imageRepository.findOne({
          where: { product: photo.product, isPrimary: false },
          order: { createdAt: 'ASC' },
        });

        if (anotherPhoto) {
          anotherPhoto.isPrimary = true;
          await this.imageRepository.save(anotherPhoto);
        }
      }

      const updatedProduct = await this.findById(photo.product.id);

      return updatedProduct;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_DELETE_PRODUCT_PHOTO,
      );
    }
  }

  async setPrimaryPhoto(
    vendorId: string,
    photoUrl: string,
  ): Promise<ProductResponseDTO> {
    try {
      const vendor = await this.userRepository.findOne({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new NotFoundException(Errors.USER_NOT_FOUND);
      }

      if (vendor.role !== Role.VENDOR || vendor.isAccountActive === false) {
        throw new ForbiddenException(Errors.FORBIDDEN_TO_SET_PRIMARY_PHOTO);
      }

      const photo = await this.imageRepository.findOne({
        where: { url: photoUrl },
        relations: { product: true },
      });

      if (!photo) {
        throw new NotFoundException(Errors.IMAGE_NOT_FOUND);
      }

      if (photo.product.vendorId !== vendorId) {
        throw new ForbiddenException(
          Errors.FORBIDDEN_TO_SET_PRIMARY_PHOTO_FROM_OTHER_VENDORS,
        );
      }

      await this.imageRepository.update(
        { product: photo.product, isPrimary: true },
        { isPrimary: false },
      );

      photo.isPrimary = true;
      await this.imageRepository.save(photo);

      const updatedProduct = await this.findById(photo.product.id);

      return updatedProduct;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_SET_PRIMARY_PHOTO,
      );
    }
  }

  async updateProduct(
    id: string,
    vendorId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<void> {
    const {
      name,
      description,
      price,
      size,
      brand,
      colors,
      /*
      material,
      categories,
      style,
      type,*/
    } = updateProductDto;

    const product = await this.productRepository.findOne({
      where: { id, vendorId },
      relations: ['color', 'brand'],
    });
    // console.log(product);

    if (!product) {
      throw new NotFoundException(Errors.PRODUCT_NOT_FOUND);
    }

    if (name) {
      product.name = name;
      product.slug = this.generateSlug(name);
    }

    if (description) {
      product.description = description;
    }

    if (price) {
      product.price = price;
    }

    if (size) {
      product.size = size;
    }

    if (colors) {
      const colorsFromDb = await this.colorRepository.find({
        where: colors.map((colorName) => ({ color: colorName })),
      });

      product.color = colorsFromDb;
    }

    if (brand) {
      const brandFromDb = await this.brandRepository.findOne({
        where: { brand: updateProductDto.brand },
      });

      if (brandFromDb) {
        product.brand = brandFromDb;
      }
      console.log(brand, brandFromDb);
    }

    product.lastUpdatedAt = new Date();
    this.productRepository.save(product);
  }

  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    return slug;
  }

  private sortImages(images: Image[]): Image[] {
    const reverseOrder = -1;
    const normalOrder = 1;

    return images.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) {
        return reverseOrder;
      } else if (!a.isPrimary && b.isPrimary) {
        return normalOrder;
      } else {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });
  }
}
