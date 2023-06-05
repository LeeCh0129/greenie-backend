import { Expose } from 'class-transformer';

export class PayloadDto {
  @Expose()
  id: number;
  @Expose()
  email: string;
  @Expose()
  nickname: string;
  @Expose()
  emailVerified: boolean;
}
