import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/dtos/page.dto';
import { PostLike } from 'src/entities/post-like.entity';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dtos/create-post.dto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
    @Inject('S3_CLIENT')
    private readonly s3Client: S3Client,
  ) {}

  async findAll(page: number, take: number): Promise<PageDto<Post>> {
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .take(take)
      .skip(take * (page - 1))
      .select([
        'post.id',
        'post.title',
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

  async patchLike(user: User, postId: number) {
    const post = await this.postRepository
      .findOneBy({ id: postId })
      .catch(() => {
        throw new InternalServerErrorException('게시글을 조회 실패');
      });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }

    const likePost = await this.postLikeRepository
      .createQueryBuilder('post_like')
      .where('post_like.user_id = :user_id', { user_id: user['id'] })
      .andWhere('post_like.post_id = :post_id', { post_id: postId })
      .getOne()
      .catch(() => {
        throw new InternalServerErrorException('게시글 좋아요 조회 실패');
      });

    if (likePost) {
      await this.postLikeRepository.delete({ id: likePost.id }).catch(() => {
        throw new InternalServerErrorException('게시글 좋아요 취소 실패');
      });
      await this.postRepository
        .update(post.id, {
          likeCount: () => 'like_count - 1',
        })
        .catch(() => {
          throw new InternalServerErrorException('게시글 업데이트 실패');
        });
      return { message: '좋아요 취소 성공', likeCount: post.likeCount - 1 };
    }

    const postLike = await this.postLikeRepository.create({
      post: post,
      user: user,
    });

    await this.postLikeRepository.save(postLike).catch(() => {
      throw new InternalServerErrorException('게시글 좋아요 저장 실패');
    });
    await this.postRepository
      .update(post.id, {
        likeCount: () => 'like_count + 1',
      })
      .catch(() => {
        throw new InternalServerErrorException('게시글 업데이트 실패');
      });

    return { message: '좋아요 성공', likeCount: post.likeCount + 1 };
  }

  async create(user: User, title: string, body: string): Promise<Post> {
    try {
      const post = await this.postRepository.create({
        title,
        body,
        author: user,
      });

      await this.postRepository.save(post);
      return post;
    } catch (e) {
      throw new InternalServerErrorException('게시글 작성에 실패했습니다');
    }
  }

  async update(postId: number, user: User, body: Partial<CreatePostDto>) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null },
      relations: { author: true },
      select: {
        id: true,
        title: true,
        body: true,
        author: {
          id: true,
        },
      },
    });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }
    if (post.author.id !== user.id) {
      throw new BadRequestException('작성자만 게시글을 수정할 수 있습니다');
    }

    try {
      await this.postRepository.update(postId, body);
    } catch (e) {
      throw new InternalServerErrorException('게시글 업데이트에 실패했습니다');
    }

    return { message: '게시글 수정 성공' };
  }

  async upload(files: Express.Multer.File[]) {
    const imageUrls: string[] = [];
    await Promise.all(
      files.map(async (file: Express.Multer.File) => {
        const key = 'images/' + Date.now() + file.originalname;
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: 'greenie-bucket',
            Key: key,
            Body: file.buffer,
          }),
        );
        imageUrls.push(key);
      }),
    );

    return { imageUrls };
  }

  async delete(postId: number, user: User) {
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
    console.log(post);
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다');
    }
    if (post.author.id !== user.id) {
      throw new BadRequestException('작성자만 게시글을 삭제할 수 있습니다');
    }
    try {
      await this.postRepository.softDelete(postId);
    } catch (e) {
      throw new InternalServerErrorException('게시글 삭제에 실패했습니다.');
    }
    console.log('게시글 삭제 성공');

    return { message: '게시글 삭제 성공' };
  }
}
