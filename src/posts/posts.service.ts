import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/dtos/page.dto';
import { PostLike } from 'src/entities/post-like.entity';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreatePostDto } from './dtos/create-post.dto';
import {
  CopyObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { PayloadDto } from 'src/dtos/payload.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    @Inject('S3_CLIENT') private readonly s3Client: S3Client,
  ) {}

  async findAll(page: number, take: number): Promise<PageDto<Post>> {
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .take(take)
      .skip(take * (page - 1))
      .select([
        'post.id',
        'post.title',
        'post.thumbnail',
        'post.likeCount',
        'post.createdAt',
        'user.id',
        'user.nickname',
      ])
      .leftJoin('post.author', 'user')
      .where('post.deletedAt IS NULL')
      .orderBy('post.createdAt', 'DESC')
      .getManyAndCount();
    return new PageDto<Post>(posts[1], take, posts[0]);
  }

  async findOne(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    if (userId) {
      const user = new User();
      user.id = userId;

      const postLike = await this.postLikeRepository.findOne({
        where: {
          post: post,
          user: user,
        },
      });

      if (postLike) {
        post.postLike.push(postLike);
      }
    }

    return post;
  }

  async patchLike(userId: number, postId: number) {
    const post = await this.postRepository
      .findOneBy({ id: postId })
      .catch(() => {
        throw new InternalServerErrorException('게시글을 조회 실패');
      });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    const beforePostLike = await this.postLikeRepository
      .createQueryBuilder('post_like')
      .where('post_like.user_id = :user_id', { user_id: userId })
      .andWhere('post_like.post_id = :post_id', { post_id: postId })
      .getOne()
      .catch(() => {
        throw new InternalServerErrorException('게시글 좋아요 조회 실패');
      });

    await this.entityManager.transaction(async (transactionEntityManager) => {
      if (beforePostLike) {
        await transactionEntityManager
          .delete(PostLike, { id: beforePostLike.id })
          .catch(() => {
            throw new InternalServerErrorException('게시글 좋아요 취소 실패');
          });
        await transactionEntityManager
          .update(Post, post.id, {
            likeCount: () => 'like_count - 1',
          })
          .catch(() => {
            throw new InternalServerErrorException('게시글 업데이트 실패');
          });
        return;
      }

      const user = new User();
      user.id = userId;

      const postLike = await transactionEntityManager.create(PostLike, {
        post: post,
        user: user,
      });

      await transactionEntityManager.save(postLike).catch(() => {
        throw new InternalServerErrorException('게시글 좋아요 저장 실패');
      });
      await transactionEntityManager
        .update(Post, post.id, {
          likeCount: () => 'like_count + 1',
        })
        .catch(() => {
          throw new InternalServerErrorException('게시글 업데이트 실패');
        });
    });

    if (beforePostLike) {
      return { message: '좋아요 취소 성공', likeCount: post.likeCount - 1 };
    }
    return { message: '좋아요 성공', likeCount: post.likeCount + 1 };
  }

  async create(
    userId: number,
    title: string,
    content: string,
    thumbnail: string,
  ): Promise<Post> {
    try {
      const user = new User();
      user.id = userId;

      const post = await this.postRepository.create({
        title,
        content,
        thumbnail,
        author: user,
      });

      await this.postRepository.save(post);
      return post;
    } catch (e) {
      throw new InternalServerErrorException('게시글 작성에 실패했습니다');
    }
  }

  async update(
    postId: number,
    userId: number,
    content: Partial<CreatePostDto>,
  ) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null },
      relations: { author: true },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          id: true,
        },
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    if (post.author.id !== userId) {
      throw new BadRequestException('작성자만 게시글을 수정할 수 있습니다');
    }

    try {
      await this.postRepository.update(postId, content);
    } catch (e) {
      throw new InternalServerErrorException('게시글 업데이트에 실패했습니다');
    }

    return { message: '게시글 수정 성공' };
  }

  async upload(images: Express.Multer.File[], userId: number) {
    const imageUrls: string[] = [];

    await Promise.all(
      //만약 중간에 실패하면 어떻게 처리할 것인가?
      images.map(async (image: Express.Multer.File) => {
        const key = 'images/' + Date.now() + '-' + userId;
        this.s3Client.send(
          new PutObjectCommand({
            Bucket: 'greenie-bucket',
            Key: key,
            Body: image.buffer,
          }),
        );
        imageUrls.push(key);
      }),
    );

    return { imageUrls, message: '이미지 저장 성공' };
  }

  async delete(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null },
      relations: { author: true },
      select: {
        id: true,
        deletedAt: true,
        author: {
          id: true,
        },
      },
    });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }
    if (post.author.id !== userId) {
      throw new BadRequestException('작성자만 게시글을 삭제할 수 있습니다');
    }
    try {
      await this.postRepository.softDelete(postId);
    } catch (e) {
      throw new InternalServerErrorException('게시글 삭제에 실패했습니다.');
    }

    return { message: '게시글 삭제 성공' };
  }
}
