import { IsString } from 'class-validator';
import { EmailDto } from './email.dto';
import { ApiProperty } from '@nestjs/swagger';

export class OtpDto extends EmailDto {
  @IsString()
  @ApiProperty({ description: '이메일', default: 'test@test.com' })
  email: string;

  @IsString()
  @ApiProperty({ description: 'OTP', default: '' })
  otp: string;

  @IsString()
  @ApiProperty({
    description: '모드 (email 또는 changePassword)',
    default: 'email',
  })
  mode: string;
}
