import { ApiProperty } from '@nestjs/swagger';
export class PageDto<T> {
  @ApiProperty()
  totalCount: number;
  @ApiProperty()
  totalPage: number;
  @ApiProperty()
  items: T[];

  constructor(totalCount: number, take: number, items: T[]) {
    this.totalCount = totalCount;
    this.totalPage = Math.ceil(totalCount / take);
    this.items = items;
  }
}
