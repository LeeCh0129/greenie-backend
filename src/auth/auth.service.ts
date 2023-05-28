import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectEntityManager() private entityManager: EntityManager,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<object> {
    const user = await this.entityManager.findOne(User, {
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 계정입니다');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('잘못된 비밀번호입니다');
    }

    if (user.emailVerified !== true) {
      throw new ForbiddenException('이메일 인증을 진행해주세요');
    }

    const accessToken = this.generateAccessToken(user);

    const refreshToken = await this.generateRefreshToken(user.id);

    return { message: '로그인 성공', accessToken, refreshToken };
  }

  async requestEmailVerification(email: string) {
    const user = await this.entityManager.exists(User, { where: { email } });

    if (!user) {
      throw new NotFoundException('존재하지 않는 이메일입니다.');
    }

    await this.entityManager.update(
      User,
      { email },
      {
        emailVerified: true,
      },
    );

    return '임시 이메일 인증 완료';
    // const { email } = await this.auth.getUser(firebaseId);
    // const user = await this.auth.getUserByEmail(email).catch((error) => {
    //   if (error['errorInfo']['code'] == 'auth/user-not-found') {
    //     throw new NotFoundException('가입된 회원이 아닙니다.');
    //   }
    //   throw new InternalServerErrorException(
    //     '유저 데이터를 불러오는데 실패했습니다.',
    //   );
    // });
    // if (user.emailVerified) {
    //   throw new BadRequestException('이미 인증된 이메일입니다.');
    // }
    // try {
    //   const emailLink = await this.auth.generateEmailVerificationLink(email);
    //   await this.mailerService.sendMail({
    //     from: '모하지스튜디오 그리니 <mohajistudio@gmail.com>',
    //     to: email,
    //     subject: '[그리니] 이메일 유효성 검사',
    //     html: `<h4>안녕하세요, 그리니 이메일 유효성 검사를 위한 메일입니다.</h4>
    //     <a href="${emailLink}"> 여기를 클릭해주세요 </a>`,
    //   });
    //   return { message: '이메일 인증을 완료해주세요' };
    // } catch (error) {
    //   return new BadRequestException(error['errorInfo']['message']);
    // }
  }

  async register(
    email: string,
    password: string,
    nickname: string,
  ): Promise<User> {
    const existEmail = await this.entityManager.exists(User, {
      where: { email },
    });
    if (existEmail) {
      throw new BadRequestException('이미 존재하는 이메일입니다');
    }

    const existNickname = await this.entityManager.exists(User, {
      where: { nickname },
    });
    if (existNickname) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    const encryptedPassword = await this.encrypt(password);
    const user = this.entityManager.create(User, {
      email,
      nickname,
      password: encryptedPassword,
    });

    await this.entityManager.save(user);

    return user;
  }

  async getRefreshToken(userId: number, refreshToken: string) {
    const isVerified = await this.verifyRefreshToken(userId, refreshToken);
    if (!isVerified) {
      throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
    }

    return { refreshToken: await this.generateRefreshToken(userId) };
  }

  async checkNicknameDuplicate(nickname: string) {
    if (!nickname) {
      throw new BadRequestException('닉네임을 입력해주세요.');
    }

    const user = await this.entityManager.exists(User, {
      where: {
        nickname: nickname,
      },
    });

    if (user) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    return { message: '사용가능한 닉네임입니다.' };
  }

  async encrypt(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(
      parseInt(this.configService.get<string>('SALT_OR_ROUNDS')),
    );

    return bcrypt.hashSync(password, salt);
  }

  generateAccessToken(user: User): string {
    return this.jwtService.sign(JSON.parse(JSON.stringify(user)), {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: '1h',
    });
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const payload = { sub: userId };

    const refreshToken = this.jwtService.sign(
      JSON.parse(JSON.stringify(payload)),
      {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      },
    );

    const encryptedRefreshToken = await this.encrypt(refreshToken);

    await this.entityManager.update(User, userId, {
      refreshToken: encryptedRefreshToken,
    });

    return refreshToken;
  }

  async generateTokenFromRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<object> {
    try {
      const user = await this.verifyRefreshToken(userId, refreshToken);

      const generatedAccessToken = this.generateAccessToken(user);

      return {
        accessToken: generatedAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
    }
  }

  async verifyRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<User> {
    try {
      const user = await this.entityManager.findOneBy(User, { id: userId });

      if (!user || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
        throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
      }

      const isVerified = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      if (!isVerified) {
        throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
      }

      return user;
    } catch (e) {
      throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
    }
  }
}
