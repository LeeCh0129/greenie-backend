import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto } from 'src/auth/dtos/page.dto';
import { PostLike } from 'src/entities/post-like.entity';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private postLikeRepository: Repository<PostLike>,
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
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('post not found');
    }

    const likePost = await this.postLikeRepository
      .createQueryBuilder('post_like')
      .where('post_like.user_id = :user_id', { user_id: user['id'] })
      .andWhere('post_like.post_id = :post_id', { post_id: postId })
      .getOne();

    if (likePost) {
      await this.postLikeRepository.delete({ id: likePost.id });
      await this.postRepository.update(post.id, {
        likeCount: () => 'like_count - 1',
      });
      post.likeCount -= 1;
      return post;
    }

    const postLike = await this.postLikeRepository.create({
      post: post,
      user: user,
    });
    await this.postLikeRepository.save(postLike);
    await this.postRepository.update(post.id, {
      likeCount: () => 'like_count + 1',
    });
    post.likeCount += 1;
    return post;
  }

  async create(user: User, title: string, body: string): Promise<Post> {
    const post = await this.postRepository.create({
      title,
      body,
      author: user,
    });

    await this.postRepository.save(post);

    return post;
  }
}
