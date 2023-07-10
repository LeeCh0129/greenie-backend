import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { EmailDto } from 'src/dtos/email.dto';
import { OtpDto } from 'src/dtos/otp.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { PayloadDto } from 'src/dtos/payload.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { AuthService } from 'src/auth/auth.service';
import { ChangePasswordDto } from 'src/dtos/change-password.dto';
import { OtpRequestDto } from 'src/dtos/otp-request.dto';
import { BadRequestException } from '@nestjs/common';

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

  @Post('email-verification')
  @ApiOperation({ summary: '이메일 OTP 인증 요청' })
  @ApiResponse({ status: 201, description: 'OTP 인증 요청 성공' })
  @ApiBadRequestResponse({
    status: 404,
    description: '해당 이메일을 찾을 수 없습니다.',
  })
  sendOtp(@Body() otpRequest: OtpRequestDto) {
    if (otpRequest.mode === 'email') {
      return this.usersService.sendOtpEmail(otpRequest.email, 'email');
    } else if (otpRequest.mode === 'changePassword') {
      return this.usersService.sendOtpEmail(otpRequest.email, 'changePassword');
    } else {
      throw new BadRequestException('잘못된 요청입니다.');
    }
  }

  @Patch('email-verification')
  @ApiOperation({ summary: 'OTP 인증' })
  @ApiBadRequestResponse({ description: '올바르지 않은 OTP 또는 만료' })
  @ApiNotFoundResponse({ description: '해당 이메일을 찾을 수 없습니다.' })
  @ApiOkResponse({
    description: '이메일 OTP 인증 완료',
  })
  @ApiResponse({
    status: 200,
    description: '이메일 OTP 인증 완료',
  })
  requestOtpVerification(@Body() otpDto: OtpDto) {
    return this.usersService.verifyOtp(
      otpDto.email,
      otpDto.otp,
      'changePassword',
    );
  }
  @Patch('password')
  changePassword(
    @CurrentUser() user: PayloadDto,
    @Body() password: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      password.email,
      password.otp,
      password.newPassword,
      password.mode,
    );
  }
}
