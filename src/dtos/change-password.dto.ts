import { IsString } from 'class-validator';
import { PasswordDto } from './password.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto extends PasswordDto {
  @IsString()
  @ApiProperty({ description: '새로운 비밀번호', default: 'test1234' })
  newPassword: string;
}
