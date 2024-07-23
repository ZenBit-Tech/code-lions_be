import { MAX_PRODUCT_PDF_SIZE } from 'src/config';

import { FileUploadInterceptor } from './file-upload.interceptor';

export class ProductPdfUploadInterceptor extends FileUploadInterceptor {
  protected allowedFileTypes = ['pdf'];
  protected maxFilesize = MAX_PRODUCT_PDF_SIZE;

  constructor() {
    super();
  }
}
