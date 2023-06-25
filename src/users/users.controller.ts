import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { PayloadDto } from 'src/dtos/payload.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { PasswordDto } from 'src/dtos/password.dto';
import { AuthService } from 'src/auth/auth.service';
import { ChangePasswordDto } from 'src/dtos/change-password.dto';

@Controller('users')
@ApiTags('유저')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

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

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: PayloadDto,
    @Body() password: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      password.password,
      password.newPassword,
    );
  }
}
