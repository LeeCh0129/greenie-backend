import { S3Client } from '@aws-sdk/client-s3';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const S3Provider = [
  {
    provide: 'S3_CLIENT',
    import: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      return new S3Client({
        region: configService.get('AWS_S3_REGION'),
        credentials: {
          accessKeyId: configService.get('AWS_S3_ACCESS_KEY_ID'),
          secretAccessKey: configService.get('AWS_S3_SECRET_ACCESS_KEY'),
        },
      });
    },
  },
];
