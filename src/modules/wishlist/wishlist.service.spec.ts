import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Status } from 'src/modules/products/entities/product-status.enum';
import { ProductTypes } from 'src/modules/products/entities/product-types.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { Styles } from 'src/modules/products/entities/styles.enum';
import { User } from 'src/modules/users/user.entity';

import { Wishlist } from './wishlist.entity';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  /* eslint-disable */
  let service: WishlistService;
  let wishlistRepository: Repository<Wishlist>;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  /* eslint-enable */

  const mockWishlistRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockProduct = new Product();

  mockProduct.id = 'product-id';
  mockProduct.name = 'Test Product';
  mockProduct.slug = 'test-product';
  mockProduct.price = 100;
  mockProduct.description = 'A test product';
  mockProduct.categories = [];
  mockProduct.style = Styles.CASUAL;
  mockProduct.type = ProductTypes.DRESS;
  mockProduct.status = Status.PUBLISHED;
  mockProduct.size = 'M';
  mockProduct.images = [];
  mockProduct.color = [];
  mockProduct.user = new User();
  mockProduct.user.id = 'user-id';
  mockProduct.user.name = 'Test User';
  mockProduct.user.photoUrl = '';
  mockProduct.createdAt = new Date();
  mockProduct.lastUpdatedAt = new Date();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getRepositoryToken(Wishlist),
          useValue: mockWishlistRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    wishlistRepository = module.get<Repository<Wishlist>>(
      getRepositoryToken(Wishlist),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToWishlist', () => {
    it('should add a product to the wishlist', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-id' });
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockWishlistRepository.findOne.mockResolvedValue(null);
      mockWishlistRepository.create.mockReturnValue({
        userId: 'user-id',
        productId: 'product-id',
      });
      mockWishlistRepository.save.mockResolvedValue({});

      await expect(
        service.addToWishlist('user-id', 'product-id'),
      ).resolves.not.toThrow();
    });

    it('should throw ConflictException if product is already in the wishlist', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-id' });
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockWishlistRepository.findOne.mockResolvedValue({});

      await expect(
        service.addToWishlist('user-id', 'product-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove a product from the wishlist', async () => {
      mockWishlistRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(
        service.removeFromWishlist('user-id', 'product-id'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if wishlist entry is not found', async () => {
      mockWishlistRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeFromWishlist('user-id', 'product-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWishlist', () => {
    it('should return the wishlist for a user', async () => {
      mockWishlistRepository.find.mockResolvedValue([
        { productId: 'product-id', product: mockProduct },
      ]);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.getWishlist('user-id');

      expect(result).toEqual([
        {
          id: mockProduct.id,
          name: mockProduct.name,
          slug: mockProduct.slug,
          price: mockProduct.price,
          description: mockProduct.description,
          categories: mockProduct.categories,
          style: mockProduct.style,
          type: mockProduct.type,
          size: mockProduct.size,
          images: mockProduct.images,
          status: mockProduct.status,
          colors: mockProduct.color,
          vendor: {
            id: mockProduct.user.id,
            name: mockProduct.user.name,
            photoUrl: mockProduct.user.photoUrl,
          },
          createdAt: mockProduct.createdAt,
          lastUpdatedAt: mockProduct.lastUpdatedAt,
        },
      ]);
    });
  });
});
