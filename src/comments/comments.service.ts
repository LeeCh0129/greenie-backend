import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/dtos/page.dto';
import { CommentLike } from 'src/entities/comment-like.entity';
import { Comment } from 'src/entities/comment.entity';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentsRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
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
    } catch (e) {
      console.log(e);
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
      // group = temp.group;
      if (temp) {
        group = temp.group;
      } else {
        group = 0;
      }
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

  async patchLike(userId: number, commentId: number) {
    const comment = await this.commentsRepository
      .findOneBy({ id: commentId })
      .catch(() => {
        throw new InternalServerErrorException('댓글 조회 실패');
      });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    const beforeCommentLike = await this.commentLikeRepository
      .createQueryBuilder('comment_like')
      .where('comment_like.user_id = :user_id', { user_id: userId })
      .andWhere('comment_like.comment_id = :comment_id', {
        comment_id: commentId,
      })
      .getOne()
      .catch(() => {
        throw new InternalServerErrorException('댓글 좋아요 조회 실패');
      });

    await this.entityManager.transaction(async (transactionEntityManager) => {
      if (beforeCommentLike) {
        await transactionEntityManager
          .delete(CommentLike, { id: beforeCommentLike.id })
          .catch(() => {
            throw new InternalServerErrorException('댓글 좋아요 취소 실패');
          });
        await transactionEntityManager
          .update(Comment, comment.id, {
            likeCount: () => 'like_count-1',
          })
          .catch(() => {
            throw new InternalServerErrorException('댓글 업데이트 실패');
          });
        return;
      }

      const user = new User();
      user.id = userId;

      const commentLike = await transactionEntityManager.create(CommentLike, {
        comment: comment,
        user: user,
      });

      await transactionEntityManager.save(commentLike).catch(() => {
        throw new InternalServerErrorException('댓글 좋아요 저장 실패');
      });
      await transactionEntityManager
        .update(Comment, comment.id, {
          likeCount: () => 'like_count + 1',
        })
        .catch(() => {
          throw new InternalServerErrorException('댓글 업데이트 실패');
        });
    });

    if (beforeCommentLike) {
      return { message: '좋아요 취소 성공', likeCount: comment.likeCount - 1 };
    }
    return { message: '좋아요 성공', likeCount: comment.likeCount + 1 };
  }
}
