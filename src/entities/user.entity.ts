import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { Post } from './post.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  nickname: string;

  @Column({ unique: true, select: false })
  firebaseId: string;

  @OneToMany(() => Post, (post) => post.author)
  post: Post[];

  @OneToMany(() => PostLike, (postLike) => postLike.user)
  postLike: PostLike[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comment: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
