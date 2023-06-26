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
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { User } from './user.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  thumbnail: string;

  @Column({ length: 30 })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne(() => User, (user) => user.post, { nullable: false })
  author: User;

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  postLike: PostLike[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comment: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
