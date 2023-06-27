import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Post } from 'src/entities/post.entity';

export class PostResponseDto {
  @ApiProperty({
    description: '게시글 id',
  })
  id: number;

  @ApiProperty({ description: '게시글 제목' })
  title: string;

  @ApiProperty({ description: '게시글 내용' })
  body: string;

  @ApiProperty({ description: '게시글 좋아요' })
  likeCount: number;

  @ApiProperty({ description: '게시글 작성자' })
  author: { id: number; nickname: string };

  @ApiProperty({ description: '게시글 작성일' })
  createdAt: Date;

  @ApiProperty({ description: '게시글 삭제일' })
  deletedAt: Date;

  @ApiProperty({ description: '게시글 수정일' })
  updatedAt: Date;

  constructor(post: Post) {
    this.id = post.id;
    this.title = post.title;
    this.likeCount = post.likeCount;
    this.author = { id: post.author.id, nickname: post.author.nickname };
    this.createdAt = post.createdAt;
    this.deletedAt = post.deletedAt;
    this.updatedAt = post.updatedAt;
  }
}
