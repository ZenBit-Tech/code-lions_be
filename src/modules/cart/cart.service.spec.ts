import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductTypes } from 'src/modules/products/entities/product-types.enum';
import { Product } from 'src/modules/products/entities/product.entity';
import { Styles } from 'src/modules/products/entities/styles.enum';
import { User } from 'src/modules/users/user.entity';

import { Cart } from './cart.entity';
import { CartService } from './cart.service';

const mockDuration: number = 7;
const mockPrice: number = 100;

describe('CartService', () => {
  /* eslint-disable */
  let service: CartService;
  let cartRepository: Repository<Cart>;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  /* eslint-enable */

  const mockCartRepository = {
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
  mockProduct.size = 'M';
  mockProduct.images = [];
  mockProduct.color = [];
  mockProduct.vendorId = 'vendor-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: mockCartRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToCart', () => {
    it('should add a product to the cart', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-id' });
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockCartRepository.create.mockReturnValue({
        userId: 'user-id',
        productId: 'product-id',
      });
      mockCartRepository.save.mockResolvedValue({});

      await expect(
        service.addToCart('user-id', 'product-id', mockDuration, mockPrice),
      ).resolves.not.toThrow();
    });

    it('should throw ConflictException if product is already in the cart', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-id' });
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockCartRepository.findOne.mockResolvedValue({});

      await expect(
        service.addToCart('user-id', 'product-id', mockDuration, mockPrice),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFromCart', () => {
    it('should remove a product from the cart', async () => {
      mockCartRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(
        service.removeFromCart('user-id', 'product-id'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if cart entry is not found', async () => {
      mockCartRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeFromCart('user-id', 'product-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCart', () => {
    it('should return the cart for a user', async () => {
      mockCartRepository.find.mockResolvedValue([
        {
          id: 'cart-id',
          userId: 'user-id',
          productId: 'product-id',
          vendorId: 'vendor-id',
          productUrl: 'test-url',
          size: 'M',
          color: 'green',
          duration: 7,
          price: 100,
          createdAt: new Date(),
        },
      ]);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.getCart('user-id');

      expect(result).toEqual([
        {
          id: 'cart-id',
          userId: 'user-id',
          productId: 'product-id',
          vendorId: 'vendor-id',
          productUrl: 'test-url',
          name: mockProduct.name,
          size: 'M',
          color: 'green',
          duration: 7,
          price: 100,
          createdAt: expect.any(Date),
        },
      ]);
    });
  });
});
