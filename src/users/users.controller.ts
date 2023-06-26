import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmailDto } from 'src/dtos/email.dto';
import { OtpDto } from 'src/dtos/otp.dto';

@Controller('users')
@ApiTags('유저')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  @Post('email-verification')
  @ApiOperation({ summary: '이메일 OTP 인증 요청' })
  @ApiResponse({ status: 201, description: 'OTP 인증 요청 성공' })
  @ApiBadRequestResponse({
    status: 404,
    description: '해당 이메일을 찾을 수 없습니다.',
  })
  sendOtp(@Body() emailDto: EmailDto) {
    return this.usersService.sendOtpEmail(emailDto.email);
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
    return this.usersService.verifyOtp(otpDto.email, otpDto.otp);
  }
}
