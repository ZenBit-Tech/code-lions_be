import { Image } from 'src/modules/products/entities/image.entity';

export function sortImages(images: Image[]): Image[] {
  const reverseOrder = -1;
  const normalOrder = 1;

  return images.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) {
      return reverseOrder;
    } else if (!a.isPrimary && b.isPrimary) {
      return normalOrder;
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });
}
