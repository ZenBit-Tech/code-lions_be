import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';

import {
  PRODUCTS_ON_PAGE,
  DAYS_JUST_IN,
  DEFAULT_SORT,
  DEFAULT_ORDER,
} from 'src/config';
import { mockProduct } from 'src/mocks/mock-product';
import { Cart } from 'src/modules/cart/cart.entity';
import { Role } from 'src/modules/roles/role.enum';
import { User } from 'src/modules/users/user.entity';
import { Wishlist } from 'src/modules/wishlist/wishlist.entity';

import { ProductResponseDTO } from './dto/product-response.dto';
import { Category } from './entities/category.enum';
import { Status } from './entities/product-status.enum';
import { ProductTypes } from './entities/product-types.enum';
import { Product } from './entities/product.entity';
import { Styles } from './entities/styles.enum';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let userRepository: Repository<User>;
  let cartRepository: Repository<Cart>;
  let wishlistRepository: Repository<Wishlist>;

  const mockProducts: ProductResponseDTO[] = [
    {
      id: '61c674384-f944-401b-949b-b76e8793bdc9',
      name: 'Test Product',
      slug: 'test-product',
      price: 100,
      description: 'A test product',
      categories: [Category.CLOTHING],
      style: Styles.CASUAL,
      type: ProductTypes.DRESS,
      size: 'M',
      images: [],
      colors: [],
      status: Status.PUBLISHED,
      vendor: {
        id: '44c674384-f944-401b-949b-b76e8793bdc9',
        name: 'Test Vendor',
        photoUrl: '',
      },
      createdAt: new Date('2024-07-05T18:15:14.950Z'),
      lastUpdatedAt: new Date('2024-07-05T18:15:14.950Z'),
      deletedAt: null,
    },
  ];

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Cart),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Wishlist),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    wishlistRepository = module.get<Repository<Wishlist>>(
      getRepositoryToken(Wishlist),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const expectedProducts = service.mapProducts([mockProduct]);
      const expectedResult = {
        products: expectedProducts,
        count: 1,
      };

      const response = await service.findAll(
        undefined,
        1,
        PRODUCTS_ON_PAGE,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(response).toEqual(expectedResult);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug', async () => {
      const slug = 'test-product';
      const expectedProduct = service.mapProducts([mockProduct])[0];

      const product = await service.findBySlug(slug);

      expect(product).toEqual(expectedProduct);
    });
  });

  describe('findByVendorId', () => {
    it('should return products for a valid vendorId', async () => {
      const vendorId = '44c674384-f944-401b-949b-b76e8793bdc9';
      const expectedProducts = mockProducts;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce({
        id: vendorId,
        name: 'Test Vendor',
        email: 'vendor@example.com',
        password: 'hashedpassword',
        isEmailVerified: true,
        otp: null,
        otpExpiration: null,
        role: Role.VENDOR,
        googleId: null,
        isAccountActive: true,
        photoUrl: '',
        phoneNumber: '+1234567890',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 101',
        country: 'Canada',
        state: 'Ontario',
        city: 'Toronto',
        clothesSize: 'L',
        jeansSize: 'W 27 H 33',
        shoesSize: '10',
        cardNumber: '1234 5678 9012 3456',
        expireDate: '12/24',
        cvvCode: '123',
        createdAt: new Date('2021-01-01'),
        lastUpdatedAt: new Date('2024-07-05T18:15:14.950Z'),
        deletedAt: null,
        onboardingStep: 1,
        rating: 4.5,
        orders: 2000,
        updateDatesBeforeInsert: jest.fn(),
        updateDatesBeforeUpdate: jest.fn(),
        products: [],
        cart: [],
        wishlist: [],
      } as User);

      const products = await service.findByVendorId(
        1,
        PRODUCTS_ON_PAGE,
        '',
        DEFAULT_ORDER,
        DEFAULT_SORT,
        vendorId,
      );

      expect(products).toEqual(expectedProducts);
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a product by id', async () => {
      const id = '61c674384-f944-401b-949b-b76e8793bdc9';
      const expectedProduct = service.mapProducts([mockProduct])[0];

      const product = await service.findById(id);

      expect(product).toEqual(expectedProduct);
    });
  });

  describe('deleteProduct', () => {
    const vendorId = '44c674384-f944-401b-949b-b76e8793bdc9';
    const productId = '61c674384-f944-401b-949b-b76e8793bdc9';

    it('should delete a product with INACTIVE status', async () => {
      const inactiveProduct = {
        id: productId,
        vendorId: vendorId,
        status: Status.INACTIVE,
      } as Product;

      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValueOnce(inactiveProduct);
      jest
        .spyOn(productRepository, 'delete')
        .mockResolvedValueOnce({ raw: {}, affected: 1 });

      await service.deleteProduct(vendorId, productId);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId, vendorId },
      });
      expect(productRepository.delete).toHaveBeenCalledWith(productId);
    });

    it('should soft delete a product with PUBLISHED status and delete related cart and wishlist entries', async () => {
      const publishedProduct = {
        id: productId,
        vendorId: vendorId,
        status: Status.PUBLISHED,
      } as Product;

      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValueOnce(publishedProduct);
      jest.spyOn(productRepository, 'softDelete').mockResolvedValueOnce({
        raw: {},
        affected: 1,
        generatedMaps: [],
      } as UpdateResult);
      jest
        .spyOn(cartRepository, 'delete')
        .mockResolvedValueOnce({ raw: {}, affected: 1 });
      jest
        .spyOn(wishlistRepository, 'delete')
        .mockResolvedValueOnce({ raw: {}, affected: 1 });

      await service.deleteProduct(vendorId, productId);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId, vendorId },
      });
      expect(productRepository.softDelete).toHaveBeenCalledWith(productId);
      expect(cartRepository.delete).toHaveBeenCalledWith({ productId });
      expect(wishlistRepository.delete).toHaveBeenCalledWith({ productId });
    });
  });

  describe('findLatest', () => {
    it('should return the latest products', async () => {
      const today = new Date();
      const someDaysAgo = new Date();

      someDaysAgo.setDate(today.getDate() - DAYS_JUST_IN);

      const expectedProducts = service.mapProducts([mockProduct]);
      const expectedResult = {
        products: expectedProducts,
        count: 1,
      };
      const products = await service.findLatest();

      expect(products).toEqual(expectedResult);
    });
  });

  describe('findBySize', () => {
    it('should return products by size', async () => {
      const clothesSize = 'M';
      const jeansSize = '32';
      const shoesSize = '10';

      const expectedProducts = service.mapProducts([
        mockProduct,
        mockProduct,
        mockProduct,
      ]);
      const expectedResult = {
        products: expectedProducts,
        count: 3,
      };

      const products = await service.findBySize(
        clothesSize,
        jeansSize,
        shoesSize,
      );

      expect(products).toEqual(expectedResult);
    });
  });
});
