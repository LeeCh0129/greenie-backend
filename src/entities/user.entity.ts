import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { Post } from './post.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  nickname: string;

  @Column({ unique: true, select: false })
  firebase_id: string;

  @OneToMany((type) => Post, (post) => post.author)
  post: Post[];

  @OneToMany((type) => PostLike, (postLike) => postLike.user)
  postLike: PostLike[];

  @OneToMany((type) => Comment, (comment) => comment.author)
  comment: Comment[];
}
