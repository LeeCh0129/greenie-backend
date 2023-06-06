import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EmailDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @ApiProperty({ description: '이메일', default: 'test@test.com' })
  email: string;
}
