import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { WebhookInterceptor } from './interceptors/webhook.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const PORT = process.env.PORT || 443;
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Greenie API Server Test')
    .setDescription('Greenie API Server Test')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'Bearer',
      bearerFormat: 'Bearer',
      in: 'Header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/swagger', app, document);

  if (process.env.NODE_ENV === 'prod') {
    app.useGlobalInterceptors(new WebhookInterceptor());

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
    });
  }

  await app.listen(PORT);
}
bootstrap();
