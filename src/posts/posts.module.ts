import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsModule } from 'src/comments/comments.module';
import { Comment } from 'src/entities/comment.entity';
import { PostLike } from 'src/entities/post-like.entity';
import { Post } from 'src/entities/post.entity';
import { UsersModule } from 'src/users/users.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike, Comment]),
    UsersModule,
    CommentsModule,
    UploadModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
