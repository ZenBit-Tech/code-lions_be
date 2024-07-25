import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Errors } from 'src/common/errors';
import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Status } from 'src/modules/products/entities/product-status.enum';
import { ProductTypes } from 'src/modules/products/entities/product-types.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { Styles } from 'src/modules/products/entities/styles.enum';
import { User } from 'src/modules/users/user.entity';

import { Wishlist } from './wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToWishlist(userId: string, productId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const product = await this.productRepository.findOne({
        where: { id: productId, status: Status.PUBLISHED },
      });

      if (!user || !product) {
        throw new NotFoundException(Errors.USER_OR_PRODUCT_NOT_FOUND);
      }

      const existingEntry = await this.wishlistRepository.findOne({
        where: { userId, productId },
      });

      if (existingEntry) {
        throw new ConflictException(Errors.PRODUCT_ALREADY_IN_WISHLIST);
      }

      const wishlistEntry = this.wishlistRepository.create({
        userId,
        productId,
      });

      await this.wishlistRepository.save(wishlistEntry);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_ADD_PRODUCT_TO_WISHLIST,
      );
    }
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    try {
      const result = await this.wishlistRepository.delete({
        userId,
        productId,
      });

      if (result.affected === 0) {
        throw new NotFoundException(Errors.WISHLIST_ENTRY_NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_REMOVE_PRODUCT_FROM_WISHLIST,
      );
    }
  }

  async getWishlist(userId: string): Promise<ProductResponseDTO[]> {
    try {
      const wishlist = await this.wishlistRepository.find({
        where: { userId },
        relations: ['product'],
        order: {
          createdAt: 'ASC',
        },
      });

      if (!wishlist) {
        throw new NotFoundException(Errors.WISHLIST_NOT_FOUND);
      }

      const validProducts = await Promise.all(
        wishlist.map(async (entry) => {
          const product = await this.productRepository.findOne({
            where: { id: entry.productId },
            relations: ['user', 'images', 'color'],
          });

          if (!product || product.status === Status.INACTIVE) {
            await this.removeFromWishlist(userId, entry.product.id);

            return null;
          }

          return this.transformProduct(product);
        }),
      );

      const validWishlist = validProducts.filter((product) => product !== null);

      return validWishlist;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        Errors.FAILED_TO_RETRIEVE_WISHLIST,
      );
    }
  }

  private transformProduct(inputProduct: Product): ProductResponseDTO {
    return {
      id: inputProduct.id,
      name: inputProduct.name,
      slug: inputProduct.slug,
      price: inputProduct.price,
      description: inputProduct.description,
      categories: inputProduct.categories,
      style: inputProduct.style as Styles,
      type: inputProduct.type as ProductTypes,
      status: inputProduct.status as Status,
      size: inputProduct.size,
      brand: !inputProduct?.brand?.brand ? null : inputProduct.brand.brand,
      material: inputProduct.material,
      pdfUrl: inputProduct.pdfUrl,
      images: !inputProduct?.images
        ? []
        : inputProduct.images.map((image) => image.url),
      colors: !inputProduct?.color
        ? []
        : inputProduct.color.map((color) => color.color),
      vendor: inputProduct.user
        ? {
            id: inputProduct.user.id,
            name: inputProduct.user.name,
            photoUrl: inputProduct.user.photoUrl,
          }
        : null,
      createdAt: inputProduct.createdAt,
      lastUpdatedAt: inputProduct.lastUpdatedAt,
      deletedAt: inputProduct.deletedAt,
    };
  }
}
