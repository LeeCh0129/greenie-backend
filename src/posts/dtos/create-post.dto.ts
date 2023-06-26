import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @ApiProperty({ description: '제목', default: '제목' })
  title: string;

  @IsString()
  @ApiProperty({ description: '내용', default: '내용' })
  body: string;
}
