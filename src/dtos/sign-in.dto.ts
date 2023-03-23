import { IsNotEmpty, IsString } from 'class-validator';
import { EmailDto } from './email.dto';

export class SignUpDto extends EmailDto {
  @IsNotEmpty()
  password: string;

  @IsString()
  nickname: string;
}
