import { ApiProperty } from '@nestjs/swagger';
import { Comment } from 'src/entities/comment.entity';

export class CommentResponseDto {
  @ApiProperty({ description: '댓글 ID' })
  id: number;

  @ApiProperty({ description: '댓글 내용' })
  content: string;

  @ApiProperty({ description: '댓글 작성자' })
  author: { id: number; nickname: string };

  @ApiProperty({ description: '댓글이 달린 게시물 ID' })
  postId: number;

  @ApiProperty({ description: '부모 댓글 ID', nullable: true })
  parentId?: number;

  @ApiProperty({ description: '답글 ID', nullable: true })
  replyToId?: number;

  @ApiProperty({ description: '댓글 작성일' })
  createdAt: Date;

  @ApiProperty({ description: '댓글 수정일' })
  updatedAt: Date;

  @ApiProperty({ description: '댓글 삭제일', nullable: true })
  deletedAt?: Date;

  constructor(comment: Comment) {
    this.id = comment.id;
    this.content = comment.content;
    this.author = { id: comment.author.id, nickname: comment.author.nickname };
    this.postId = comment.post.id;
    this.parentId = comment.parent?.id;
    this.replyToId = comment.replyTo?.id;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
    this.deletedAt = comment.deletedAt;
  }
}
