import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { UserProfile } from 'src/entities/user-profile.entity';
import { User } from 'src/entities/user.entity';
import { generateOTP } from 'src/utils/generate-otp.util';
import { EntityManager, Repository } from 'typeorm';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private mailService: MailerService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async findById(id: number): Promise<User> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .leftJoinAndSelect('user.post', 'post')
      .leftJoinAndSelect('user.profile', 'profile')
      .getOne();
  }
  async sendOtpEmail(email: string, mode: string): Promise<void> {
    const prefix = mode === 'email' ? 'E' : 'C';
    const otp = generateOTP(prefix);
    const user = await this.entityManager.findOne(User, { where: { email } });

    if (!user) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    }
    user.otp = otp;
    user.otpCreatedAt = new Date();
    await this.entityManager.save(user);

    console.log('otp:' + otp);
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

  async verifyOtp(email: string, otp: string, mode: string): Promise<string> {
    const user = await this.entityManager.findOne(User, {
      where: { email },
      // relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    const now = new Date();
    const otpExpiryTime =
      (now.getTime() - user.otpCreatedAt.getTime()) / (1000 * 60);

    const validTime = mode === 'changePassword' ? 10 : 5;

    if (!(user.otp === otp && otpExpiryTime <= validTime)) {
      throw new BadRequestException('유효하지 않은 OTP 입니다.');
    }
    user.emailVerified = true;
    await this.entityManager.save(user);

    return user.email;
  }

  async checkNicknameDuplicate(nickname: string) {
    if (!nickname) {
      throw new BadRequestException('닉네임을 입력해주세요.');
    }

    const user = await this.entityManager.exists(UserProfile, {
      where: {
        nickname: nickname,
      },
    });

    if (user) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    return { message: '사용가능한 닉네임입니다.' };
  }
  async update(userId: number, updateUserDto: UpdateUserDto) {
    const user = new User();
    user.id = userId;

    const userProfile = await this.entityManager.findOneBy(UserProfile, {
      user,
    });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다');
    }

    if (updateUserDto.nickname) {
      userProfile.nickname = updateUserDto.nickname;
    }

    if (updateUserDto.profileImage) {
      userProfile.profileImage = updateUserDto.profileImage;
    }

    await this.entityManager.update(
      UserProfile,
      { id: userId },
      {
        nickname: updateUserDto.nickname ?? userProfile.nickname,
        profileImage: updateUserDto.profileImage ?? userProfile.profileImage,
      },
    );

    return { message: '업데이트 성공' };
  }
}
