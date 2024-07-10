import { Product } from 'src/modules/products/entities/product.entity';

export class BestVendorsResponseDto {
  vendorId: string;
  vendorName: string;
  photoUrl: string;
  products: Product[];
}
