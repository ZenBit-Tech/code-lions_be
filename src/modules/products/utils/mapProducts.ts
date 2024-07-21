import { ProductResponseDTO } from 'src/modules/products/dto/product-response.dto';
import { Product } from 'src/modules/products/entities/product.entity';
import { sortImages } from 'src/modules/products/utils/sortImages';

export function mapProducts(products: Product[]): ProductResponseDTO[] {
  const mappedProducts: ProductResponseDTO[] = products.map((product) => {
    const sortedImages = !product?.images ? [] : sortImages(product.images);
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
