import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PRODUCTS_ON_PAGE, DAYS_JUST_IN } from 'src/config';
import { mockProduct } from 'src/mocks/mock-product';

import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
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
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
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

  describe('findById', () => {
    it('should return a product by id', async () => {
      const id = '61c674384-f944-401b-949b-b76e8793bdc9';
      const expectedProduct = service.mapProducts([mockProduct])[0];

      const product = await service.findById(id);

      expect(product).toEqual(expectedProduct);
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
