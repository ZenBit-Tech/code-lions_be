import { MAX_PRODUCT_PHOTO_SIZE } from 'src/config';

import { FileUploadInterceptor } from './file-upload.interceptor';

export class ProductPhotoUploadInterceptor extends FileUploadInterceptor {
  protected allowedFileTypes = ['jpg', 'jpeg', 'png', 'heic'];
  protected maxFilesize = MAX_PRODUCT_PHOTO_SIZE;

  constructor() {
    super();
  }
}
