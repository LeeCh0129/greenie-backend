import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';
import { Exclude } from 'class-transformer';
import { CommentLike } from './comment-like.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne((type) => User, (user) => user.comment)
  author: User;

  @ManyToOne((type) => Post, (post) => post.postLike)
  post: Post;

  @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
  commentLike: CommentLike[];

  @ManyToOne((type) => Comment, (comment) => comment.children)
  parent: Comment;

  @OneToMany((type) => Comment, (comment) => comment.parent)
  children: Comment[];

  @ManyToOne((type) => Comment)
  replyTo: Comment;

  @Column('int')
  group: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: Date;
}
