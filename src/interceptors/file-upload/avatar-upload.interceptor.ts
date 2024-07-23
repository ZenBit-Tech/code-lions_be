import { MAX_AVATAR_SIZE } from 'src/config';

import { FileUploadInterceptor } from './file-upload.interceptor';

export class AvatarUploadInterceptor extends FileUploadInterceptor {
  protected allowedFileTypes = ['jpg', 'jpeg', 'png', 'heic'];
  protected maxFilesize = MAX_AVATAR_SIZE;

  constructor() {
    super();
  }
}
