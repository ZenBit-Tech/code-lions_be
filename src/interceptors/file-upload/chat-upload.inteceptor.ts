import { MAX_CHAT_FILE_SIZE } from 'src/config';

import { FileUploadInterceptor } from './file-upload.interceptor';

export class ChatUploadInterceptor extends FileUploadInterceptor {
  protected allowedFileTypes = ['jpg', 'jpeg', 'png', 'pdf'];
  protected maxFilesize = MAX_CHAT_FILE_SIZE;

  constructor() {
    super();
  }
}
