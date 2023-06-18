import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { Post } from './post.entity';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RefreshToken } from './refresh-token-entity';

@Entity()
export class User {
  @ApiProperty({ description: 'id' })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @ApiProperty({ description: 'email', default: 'test@test.com' })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: false, name: 'email_verified' })
  @ApiProperty({ description: 'emailVerified' })
  emailVerified: boolean;

  @Column({ unique: true })
  @ApiProperty({ description: 'nickname', default: '송눈섭' })
  nickname: string;

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken;

  @OneToMany(() => Post, (post) => post.author)
  post: Post[];

  @OneToMany(() => PostLike, (postLike) => postLike.user)
  postLike: PostLike[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comment: Comment[];

  @CreateDateColumn({ name: 'created_at' })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  @Exclude()
  deletedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  otpCreatedAt: Date;

  @Column({ nullable: true })
  otp: string;

  @Column({ default: false, name: 'otp_verified' })
  @ApiProperty({ description: 'otpVerified' })
  otpVerified: boolean;
}
