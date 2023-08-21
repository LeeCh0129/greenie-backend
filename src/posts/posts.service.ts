import { UserProfile } from './../entities/user-profile.entity';
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
import { PostResponseDto } from './dtos/post-response.dto';

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
        'profile.id',
        'profile.nickname',
        'profile.profileImage',
      ])
      .leftJoin('post.author', 'user')
      .leftJoin('user.profile', 'profile')
      .where('post.deletedAt IS NULL')
      .orderBy('post.createdAt', 'DESC')
      .getManyAndCount();
    return new PageDto<Post>(posts[1], take, posts[0]);
  }

  async findUserPosts(
    userId: number,
    page: number,
    take: number,
  ): Promise<PageDto<Post>> {
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
        'profile.id',
        'profile.nickname',
        'profile.profileImage',
      ])
      .leftJoin('post.author', 'user')
      .leftJoin('user.profile', 'profile')
      .where('post.deletedAt IS NULL')
      .andWhere('user.id = :userId', { userId })
      .orderBy('post.createdAt', 'DESC')
      .getManyAndCount();

    return new PageDto<Post>(posts[1], take, posts[0]);
  }

  async findOne(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author', 'author.profile'],
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
  ): Promise<Object> {
    try {
      const user = new User();
      user.id = userId;

      //content, img 태그에서 주소를 temp에서 images로 변경
      const imageUrls: string[] = [];
      const regex = /<img[^>]+src="([^">]+)"/g;

      while (true) {
        const match = regex.exec(content);
        if (!match) {
          break;
        }

        const src = match[1];
        if (
          src.startsWith(
            'https://greenie-bucket.s3.ap-northeast-2.amazonaws.com/temp/',
          )
        ) {
          const imageUrl = src.substring(src.lastIndexOf('/') + 1);
          const newSrc = src.replace(
            'https://greenie-bucket.s3.ap-northeast-2.amazonaws.com/temp/',
            'https://greenie-bucket.s3.ap-northeast-2.amazonaws.com/images/',
          );

          content = content.replace(src, newSrc);

          imageUrls.push(imageUrl);
        }
      }

      if (thumbnail) {
        if (
          thumbnail.startsWith(
            'https://greenie-bucket.s3.ap-northeast-2.amazonaws.com/temp/',
          )
        ) {
          thumbnail = thumbnail.replace(
            'https://greenie-bucket.s3.ap-northeast-2.amazonaws.com/temp/',
            'https://greenie-bucket.s3.ap-northeast-2.amazonaws.com/images/',
          );
        }
      }

      await this.copyImageFromTempToImages(imageUrls);

      const post = await this.postRepository.create({
        title,
        content,
        thumbnail,
        author: user,
      });

      await this.postRepository.save(post);
      return { message: '작성완료' };
    } catch (e) {
      throw new InternalServerErrorException('게시글 작성에 실패했습니다');
    }
  }

  async copyImageFromTempToImages(imageUrls: string[]) {
    const newImageUrls = [];

    await Promise.all(
      imageUrls.map((imageUrl: string) => {
        const key = 'images/' + imageUrl;
        this.s3Client
          .send(
            new CopyObjectCommand({
              Bucket: 'greenie-bucket',
              CopySource: 'greenie-bucket/temp/' + imageUrl,
              Key: key,
            }),
          )
          .catch((e) => {
            throw new InternalServerErrorException(e);
          });
        newImageUrls.push(key);
      }),
    );
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
      images.map(async (image: Express.Multer.File) => {
        const key = 'temp/' + Date.now() + '-' + userId;
        this.s3Client
          .send(
            new PutObjectCommand({
              Bucket: 'greenie-bucket',
              Key: key,
              Body: image.buffer,
            }),
          )
          .catch((e) => {
            throw new InternalServerErrorException(e);
          });
        imageUrls.push(key);
      }),
    ).catch((e) => {
      throw new InternalServerErrorException('이미지 저장에 실했습니다');
    });

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
