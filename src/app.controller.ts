import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmailDto } from './dtos/email.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { User } from './entities/user.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { PayloadDto } from './dtos/payload.dto';
import { JwtAuthGuard } from './auth/jwt/jwt.guard';
import { OtpDto } from './dtos/otp.dto';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('인증')
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return 'Hello Greenie';
  }

  @Post('login')
  @ApiOperation({ summary: '로그인', description: '' })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: User,
  })
  @ApiOperation({ summary: '회원가입', description: '' })
  register(@Body() body: RegisterDto): Promise<User> {
    return this.authService.register(body.email, body.password, body.nickname);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃', description: '' })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
  })
  logout(@CurrentUser() user: PayloadDto) {
    return this.authService.logout(user.id);
  }

  @Get('refresh-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: '토큰 재발급', description: '' })
  @ApiResponse({
    status: 200,
    description: '토큰 재발급 성공',
    type: LoginResponseDto,
  })
  getRefreshToken(
    @Query('token')
    refreshToken: string,
  ) {
    return this.authService.refreshingToken(refreshToken);
  }
}
