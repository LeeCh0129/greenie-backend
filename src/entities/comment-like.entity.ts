import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from '@nestjs/common';
import { Comment } from './comment.entity';

@Entity()
export class CommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.commentLike)
  user: User;

  @ManyToOne((type) => Comment, (comment) => comment.commentLike)
  comment: Comment;

  @CreateDateColumn()
  createdAt: Date;
}
