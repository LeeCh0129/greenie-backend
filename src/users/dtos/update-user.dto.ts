import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  profileImage: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '닉네임', default: '송눈섭' })
  nickname: string;
}
