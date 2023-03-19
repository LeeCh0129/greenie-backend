import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  page: number = 1;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  take: number = 10;
}
