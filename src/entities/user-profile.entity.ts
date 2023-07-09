import { ApiProperty } from '@nestjs/swagger';
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
import { Post } from './post.entity';
import { PostLike } from './post-like.entity';
import { Comment } from './comment.entity';
import { Exclude } from 'class-transformer';
import { User } from './user.entity';

@Entity()
export class UserProfile {
  @ApiProperty({ description: 'id' })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @ApiProperty({ description: 'nickname', default: '송눈섭 ' })
  nickname: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;

  @UpdateDateColumn({ name: 'updated_at' })
  @Exclude()
  updatedAt: Date;
}
