import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.refreshToken, { nullable: false })
  @JoinColumn()
  user: User;

  @Column({ unique: true })
  refreshToken: string;
}
