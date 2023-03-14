import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { User } from './user.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  title: string;

  @Column('text')
  body: string;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne((type) => User, (user) => user.post)
  author: User;

  @OneToMany((type) => PostLike, (postLike) => postLike.post)
  postLike: PostLike[];

  @OneToMany((type) => Comment, (comment) => comment.post)
  comment: Comment[];

  @CreateDateColumn()
  createdAt: Date;
}
