import { IsString } from 'class-validator';
import { LoginDto } from './login.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto extends LoginDto {
  @IsString()
  @ApiProperty({ description: '닉네임', default: '송눈섭' })
  nickname: string;
}
