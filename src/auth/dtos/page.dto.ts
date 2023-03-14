export class PageDto<T> {
  totalCount: number;
  totalPage: number;
  items: T[];

  constructor(totalCount: number, take: number, items: T[]) {
    this.totalCount = totalCount;
    this.totalPage = Math.ceil(totalCount / take);
    this.items = items;
  }
}
