import { Expose } from 'class-transformer';

export class PayloadDto {
  id: number;
  email: string;
  nickname: string;
  emailVerified: boolean;
}
