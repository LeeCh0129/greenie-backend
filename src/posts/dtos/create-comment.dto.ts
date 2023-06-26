import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @ApiProperty({ description: '내용', default: '내용' })
  content: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '부모 댓글 ID', required: false })
  parentId: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: '답글', required: false })
  replyToId: number;
}
