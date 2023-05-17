import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CommentsModule } from './comments/comments.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AuthService } from './auth/auth.service';
import { FirebaseAuthStrategy } from './firebase/firebase-auth.strategy';
import { FirebaseApp } from './firebase/firebase-app';
import { CurrentUserMiddleware } from './middlewares/current-user.middleware';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from './entities/user.entity';
import { PostLike } from './entities/post-like.entity';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: true,
      entities: [User, Post, PostLike, Comment],
      namingStrategy: new SnakeNamingStrategy(),
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'mohajistudio@gmail.com',
          pass: process.env.MAILER_PASS,
        },
      },
      defaults: {
        from: '"nest-modules" <modules@nestjs.com>',
      },
    }),
    TypeOrmModule.forFeature([User, Post, PostLike]),
    PostsModule,
    UsersModule,
    CommentsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AuthService, FirebaseAuthStrategy, FirebaseApp],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(CurrentUserMiddleware).forRoutes({
      path: '/*',
      method: RequestMethod.ALL,
    });
  }
}
