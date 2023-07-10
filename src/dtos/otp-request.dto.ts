import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class OtpRequestDto {
  @ApiProperty({ description: '이메일', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '모드 (email 또는 changePassword)',
    example: 'email',
  })
  @IsString()
  mode: string;
}
