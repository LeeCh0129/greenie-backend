import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailDto } from './email.dto';

export class ChangePasswordDto extends EmailDto {
  @IsString()
  @ApiProperty({ description: 'OTP', default: 'C123456' })
  otp: string;

  @IsString()
  @ApiProperty({ description: '새로운 비밀번호', default: 'test1234' })
  newPassword: string;

  @IsString()
  @ApiProperty({
    description: '모드 (email 또는 password)',
    default: 'password',
  })
  mode: string;
}
