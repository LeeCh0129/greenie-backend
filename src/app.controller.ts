import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
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

  @Get('check-nickname-duplicate')
  @ApiOperation({ summary: '닉네임 중복 체크', description: '' })
  checkNicknameDuplicate(@Query('nickname') nickname: string) {
    return this.authService.checkNicknameDuplicate(nickname);
  }

  @Get('refresh-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: '토큰 재발급', description: '' })
  getRefreshToken(
    @Query('refreshToken')
    refreshToken: string,
    @Req() req: Express.Request,
  ) {
    console.log(req);
    return this.authService.refreshingToken(refreshToken);
  }

  @Post('email-verification')
  @ApiOperation({ summary: '이메일 인증', description: '' })
  emailVerification(@Body() emailDto: EmailDto) {
    return this.authService.requestEmailVerification(emailDto.email);
  }
}
