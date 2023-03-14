import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity()
export class PostLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.postLike)
  user: User;

  @ManyToOne((type) => Post, (post) => post.postLike)
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}
