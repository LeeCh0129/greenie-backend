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
import { AuthModule } from 'src/auth/auth.module';
import { CommentLike } from 'src/entities/comment-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike, Comment, CommentLike]),
    UsersModule,
    CommentsModule,
    UploadModule,
    AuthModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
