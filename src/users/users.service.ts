import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { generateOTP } from 'src/utils/generate-otp.util';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectEntityManager() private entityManger: EntityManager,
    private mailService: MailerService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .leftJoinAndSelect('user.post', 'post')
      .getOne();
  }
  async sendOtpEmail(email: string): Promise<void> {
    const otp = generateOTP();
    const user = await this.entityManger.findOne(User, { where: { email } });

    if (!user) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    }
    user.otp = otp;
    user.otpCreatedAt = new Date();
    await this.entityManger.save(user);

    await this.mailService.sendMail({
      to: email,
      from: 'mohajistudio@gmail.com',
      subject: 'Greenie OTP for authentication',
      html: `
    <html>
      <head>
        <style>
          /* Add CSS styles here */
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333333;
          }
          .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Greenie Community</h1>
          <p>Thank you for using Greenie! Please find your OTP below:</p>
          <p class="otp-code">${otp}</p>
        </div>
      </body>
    </html>
  `,
    });
  }

  async verifyOtp(email: string, otp: string): Promise<void> {
    const user = await this.entityManger.findOne(User, {
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    const now = new Date();
    const otpExpiryTime =
      (now.getTime() - user.otpCreatedAt.getTime()) / (1000 * 60);

    if (!(user.otp === otp && otpExpiryTime <= 5)) {
      throw new BadRequestException('유효하지 않은 OTP 입니다.');
    }
    user.emailVerified = true;
    await this.entityManger.save(user);
  }
}
