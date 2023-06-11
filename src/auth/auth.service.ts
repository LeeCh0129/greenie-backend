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
import { LoginResponseDto } from 'src/dtos/login-response.dto';
import { RefreshToken } from 'src/entities/refresh-token-entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectEntityManager() private entityManager: EntityManager,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
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

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: number): Promise<void> {
    await this.entityManager.delete(RefreshToken, {
      user: userId,
    });
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
  }

  async checkEmailVerification(email: string) {
    const user = await this.entityManager.findOne(User, {
      where: { email },
      select: { emailVerified: true },
    });

    return { emailVerified: user.emailVerified };
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

  decodeToken(token: string) {
    try {
      const payload = this.jwtService.decode(token);
      return payload;
    } catch (e) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token 입니다');
    }
  }

  async refreshingToken(refreshToken: string): Promise<LoginResponseDto> {
    const payload = this.decodeToken(refreshToken);

    if (!payload) {
      throw new BadRequestException('유효하지 않은 Refresh Token 입니다');
    }

    const verifyUser = await this.verifyRefreshToken(payload.sub, refreshToken);

    if (!verifyUser) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token 입니다');
    }

    const tokenExp = new Date(payload['exp'] * 1000);
    const now = new Date();

    const timeDifference = Math.floor(
      (tokenExp.getTime() - now.getTime()) / 1000 / 60 / 60 / 24,
    );

    let newRefreshToken = null;

    if (timeDifference < 14) {
      newRefreshToken = await this.generateRefreshToken(verifyUser.id);
    }

    const accessToken = this.generateAccessToken(verifyUser);

    return { accessToken, refreshToken: newRefreshToken };
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
    return this.jwtService.sign(
      JSON.parse(
        JSON.stringify({
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        }),
      ),
      {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: '1h',
      },
    );
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const payload = { sub: userId };

    const refreshToken = this.jwtService.sign(
      JSON.parse(JSON.stringify(payload)),
      {
        expiresIn: '30d',
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      },
    );

    const encryptedRefreshToken = await this.encrypt(refreshToken);

    const user = new User();
    user.id = userId;

    const refreshTokenEntity = new RefreshToken();
    refreshTokenEntity.refreshToken = encryptedRefreshToken;
    refreshTokenEntity.user = user;

    await this.entityManager.upsert(RefreshToken, refreshTokenEntity, [
      'refreshToken',
    ]);

    return refreshToken;
  }

  async verifyRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<User> {
    const user = new User();
    user.id = userId;

    const refreshTokens = await this.entityManager.findBy(RefreshToken, {
      user,
    });

    if (!refreshTokens) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token 입니다');
    }

    const foundRefreshToken = refreshTokens.find((refreshTokenEntity) =>
      bcrypt.compare(refreshToken, refreshTokenEntity.refreshToken),
    );

    if (!foundRefreshToken) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token 입니다');
    }

    const isVerified = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
    });

    if (!isVerified) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token 입니다');
    }

    return user;
  }
}
