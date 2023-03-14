import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class FindCommentDTO {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  take: number = 10;
}
