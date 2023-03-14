import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsNumber()
  @IsOptional()
  parentId: number;

  @IsNumber()
  @IsOptional()
  replyToId: number;
}
