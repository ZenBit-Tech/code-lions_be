import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Category } from 'src/modules/products/entities/category.enum';
import { Materials } from 'src/modules/products/entities/materials.enum';
import { ProductTypes } from 'src/modules/products/entities/product-types.enum';
import { Styles } from 'src/modules/products/entities/styles.enum';
export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Cool product',
    description: 'The name of the product',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 123.45,
    description: 'The price of the product in USD',
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    example: 'This is an updated product description.',
    description: 'The description of the product',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'cotton',
    description: 'The material of the product',
    enum: Materials,
  })
  @IsOptional()
  @IsEnum(Materials)
  material?: Materials;

  @ApiPropertyOptional({
    example: 'casual',
    description: 'The style of the product',
    enum: Styles,
  })
  @IsOptional()
  @IsEnum(Styles)
  style?: Styles;

  @ApiPropertyOptional({
    example: 'dress',
    description: 'The type of the product',
    enum: ProductTypes,
  })
  @IsOptional()
  @IsEnum(ProductTypes)
  type?: ProductTypes;

  @ApiPropertyOptional({
    example: ['casual', 'formal'],
    description: 'The categories of the product',
    enum: Category,
  })
  @IsOptional()
  @IsArray()
  categories?: Category[];

  @ApiPropertyOptional({ example: 'M', description: 'The size of the product' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    example: ['white', 'pink'],
    description: 'The colors of the product',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({
    example: 'Diesel',
    description: 'The brand of the product',
  })
  @IsOptional()
  @IsString()
  brand?: string;
}
