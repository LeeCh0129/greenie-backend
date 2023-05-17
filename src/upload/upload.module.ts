import { Module } from '@nestjs/common';
import { S3Provider } from './upload.service';

@Module({
  providers: [...S3Provider],
  exports: [...S3Provider],
})
export class UploadModule {}
