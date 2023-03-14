import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/auth/dtos/page.dto';
import { Comment } from 'src/entities/comment.entity';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentsRepository: Repository<Comment>,
  ) {}

  async findAll(
    postId: number,
    page: number,
    take: number,
  ): Promise<PageDto<Comment>> {
    try {
      const result = await this.commentsRepository
        .createQueryBuilder('comment')
        .take(take)
        .skip(take * (page - 1))
        .leftJoinAndSelect('comment.author', 'author')
        .where('comment.post_id = :postId', { postId })
        .orderBy('comment.group', 'DESC')
        .getManyAndCount();
      return new PageDto<Comment>(result[1], take, result[0]);
    } catch {
      throw new BadRequestException('올바르지 않은 요청입니다.');
    }
  }

  async createComment(
    author: User,
    post: Post,
    content: string,
    parentId: number | undefined,
    replyToId: number | undefined,
  ) {
    const parent = new Comment();
    parent.id = parentId;

    const replyTo = new Comment();
    replyTo.id = replyToId;

    const comment = this.commentsRepository.create({
      author,
      post,
      content,
      parent,
      replyTo,
    });

    await this.commentsRepository.save(comment);

    return comment;
  }
}
