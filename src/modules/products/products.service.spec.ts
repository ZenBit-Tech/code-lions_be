import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PRODUCTS_ON_PAGE, DAYS_JUST_IN } from 'src/config';

import { ProductResponseDTO } from './dto/product-response.dto';
import { Category } from './entities/category.enum';
import { ProductTypes } from './entities/product-types.enum';
import { Product } from './entities/product.entity';
import { Styles } from './entities/styles.enum';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

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
      vendor: {
        id: '44c674384-f944-401b-949b-b76e8793bdc9',
        name: 'Test Vendor',
        photoUrl: '',
      },
      createdAt: new Date('2024-07-05T18:15:14.950Z'),
      lastUpdatedAt: new Date('2024-07-05T18:15:14.950Z'),
    },
  ];

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          product_id: '61c674384-f944-401b-949b-b76e8793bdc9',
          product_name: 'Test Product',
          product_slug: 'test-product',
          product_price: 100,
          product_description: 'A test product',
          product_categories: Category.CLOTHING,
          product_style: Styles.CASUAL,
          product_type: ProductTypes.DRESS,
          product_size: 'M',
          user_id: '44c674384-f944-401b-949b-b76e8793bdc9',
          user_name: 'Test Vendor',
          user_photoUrl: '',
          product_createdAt: new Date('2024-07-05T18:15:14.950Z'),
          product_lastUpdatedAt: new Date('2024-07-05T18:15:14.950Z'),
          images_id: null,
          images_url: null,
          colors_color: null,
        },
      ]),
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
      const expectedProducts = mockProducts;
      const products = await service.findAll(1, PRODUCTS_ON_PAGE, '');

      expect(products).toEqual(expectedProducts);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug', async () => {
      const slug = 'test-product';
      const expectedProduct = mockProducts[0];

      const product = await service.findBySlug(slug);

      expect(product).toEqual(expectedProduct);
    });
  });

  describe('findById', () => {
    it('should return a product by id', async () => {
      const id = '61c674384-f944-401b-949b-b76e8793bdc9';
      const expectedProduct = mockProducts[0];

      const product = await service.findById(id);

      expect(product).toEqual(expectedProduct);
    });
  });

  describe('findLatest', () => {
    it('should return the latest products', async () => {
      const today = new Date();
      const someDaysAgo = new Date();

      someDaysAgo.setDate(today.getDate() - DAYS_JUST_IN);

      const expectedProducts = mockProducts;
      const products = await service.findLatest();

      expect(products).toEqual(expectedProducts);
    });
  });

  describe('findBySize', () => {
    it('should return products by size', async () => {
      const clothesSize = 'M';
      const jeansSize = '32';
      const shoesSize = '10';

      const expectedProducts = mockProducts;

      const products = await service.findBySize(
        clothesSize,
        jeansSize,
        shoesSize,
      );

      expect(products).toEqual(expectedProducts);
    });
  });
});
