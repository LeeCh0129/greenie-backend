import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { SignUpDto } from './dtos/sign-in.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return 'Hello Greenie';
  }

  @Get('signin')
  @UseGuards(AuthGuard)
  signIn(@CurrentUser() user) {
    return this.authService.signIn(+user.id, user.uid);
  }

  @Post('signup')
  signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body.email, body.password, body.nickname);
  }

  @Post('email-verification')
  emailVerification(@Body('email') email: string) {
    return this.authService.requestEmailVerification(email);
  }
}
