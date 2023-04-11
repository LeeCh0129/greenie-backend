import { Body, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { SignUpDto } from './dtos/sign-in.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return 'Hello Greenie';
  }

  @Post('signin')
  @UseGuards(AuthGuard)
  signIn(@CurrentUser() user) {
    return this.authService.signIn(+user.id, user.firebaseId);
  }

  @Post('signup')
  signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body.email, body.password, body.nickname);
  }

  @Get('check-nickname-duplicate')
  checkNicknameDuplicate(@Query('nickname') nickname: string) {
    console.log(nickname);
    return this.authService.checkNicknameDuplicate(nickname);
  }

  @Post('email-verification')
  @UseGuards(AuthGuard)
  emailVerification(@CurrentUser() user: User) {
    return this.authService.requestEmailVerification(user.firebaseId);
  }
}
