import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './auth/jwt/jwt.guard';
import { PayloadDto } from './dtos/payload.dto';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return 'Hello Greenie';
  }

  @Post('login')
  signIn(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  @UseInterceptors(ClassSerializerInterceptor)
  signUp(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.nickname);
  }

  @Get('check-nickname-duplicate')
  checkNicknameDuplicate(@Query('nickname') nickname: string) {
    return this.authService.checkNicknameDuplicate(nickname);
  }

  @Post('email-verification')
  @UseGuards(JwtAuthGuard)
  emailVerification(@CurrentUser() user: PayloadDto) {
    // return this.authService.requestEmailVerification(user.firebaseId);
  }
}
