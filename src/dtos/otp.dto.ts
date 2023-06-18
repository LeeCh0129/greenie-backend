import { IsString } from 'class-validator';
import { EmailDto } from './email.dto';

export class OtpDto extends EmailDto {
  @IsString()
  otp: string;
}
