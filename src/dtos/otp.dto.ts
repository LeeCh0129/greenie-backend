import { IsString } from 'class-validator';
import { EmailDto } from './email.dto';
import { ApiProperty } from '@nestjs/swagger';

export class OtpDto extends EmailDto {
  @IsString()
  @ApiProperty({ description: 'OTP', default: '' })
  otp: string;
}
