import { User } from 'src/entities/user.entity';

export class CommentItem {
  id: number;
  content: string;
  group: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  author: User;
}
