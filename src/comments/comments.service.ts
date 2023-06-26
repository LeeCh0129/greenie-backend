import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/dtos/page.dto';
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
        .leftJoinAndSelect('comment.replyTo', 'replyTo')
        .leftJoinAndSelect('comment.parent', 'parent')
        .where('comment.post_id = :postId', { postId })
        .select(['comment', 'author', 'replyTo.id', 'parent.id'])
        // .andWhere('comment.deletedAt = null')
        .orderBy('comment.group', 'DESC')
        .getManyAndCount();
      return new PageDto<Comment>(result[1], take, result[0]);
    } catch {
      throw new BadRequestException('올바르지 않은 요청입니다.');
    }
  }

  async create(
    authorId: number,
    postId: number,
    content: string,
    parentId: number | undefined,
    replyToId: number | undefined,
  ) {
    const parent = new Comment();
    parent.id = parentId;

    const replyTo = new Comment();
    replyTo.id = replyToId;

    const post = new Post();
    post.id = postId;

    const author = new User();
    author.id = authorId;

    let group;
    // 댓글일 경우에는 group이 기존 가장 높은 그룹 값 +1 이기때문에 조회가 필요함
    if (!parent.id && !replyTo.id) {
      const temp = await this.commentsRepository
        .createQueryBuilder('comment')
        .select('MAX(comment.group)', 'group')
        .getRawOne();
      group = temp.group;
      group++;
    } else {
      const temp = await this.commentsRepository.findOne({
        select: ['group'],
        where: {
          id: parentId,
        },
      });

      group = temp.group;
    }
    // 대댓글일 경우에는 부모 댓글의 그룹을 가져가기 떄문에 조회가 필요없음
    const comment = this.commentsRepository.create({
      author,
      post,
      content,
      parent,
      group,
      replyTo,
    });

    await this.commentsRepository.save(comment);

    return { message: '댓글 작성 완료' };
  }
}
