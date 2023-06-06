import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { EmailDto } from './email.dto';

export class LoginDto extends EmailDto {
  @IsString()
  @ApiProperty({ description: '비밀번호', default: 'test1234!' })
  password: string;
}
