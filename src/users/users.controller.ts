import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('유저')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  @Get('nickname-duplicate')
  @ApiOperation({ summary: '닉네임 중복 체크', description: '' })
  @ApiResponse({
    status: 200,
    description: '중복된 닉네임 없음',
  })
  nicknameDuplicate(@Query('nickname') nickname: string) {
    return this.usersService.checkNicknameDuplicate(nickname);
  }
}
