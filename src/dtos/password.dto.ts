import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PasswordDto {
  @IsString()
  @ApiProperty({ description: '비밀번호', default: 'test1234!' })
  password: string;
}
