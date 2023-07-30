import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comment.entity';
import { CommentsService } from './comments.service';
import { CommentLike } from 'src/entities/comment-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, CommentLike])],
  exports: [CommentsService],
  providers: [CommentsService],
})
export class CommentsModule {}
