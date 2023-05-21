import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectEntityManager() private entityManager: EntityManager,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<object> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 계정입니다');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('잘못된 비밀번호입니다');
    }

    const accessToken = this.jwtService.sign({
      id: user.id,
      email,
      nickname: user.nickname,
      emailVerified: user.emailVerified,
    });

    return { message: '로그인 성공', accessToken };
  }

  async requestEmailVerification(firebaseId: string) {
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
    const existEmail = await this.userRepository.exist({ where: { email } });
    if (existEmail) {
      throw new BadRequestException('이미 존재하는 이메일입니다');
    }

    const existNickname = await this.entityManager.exists(User, {
      where: { nickname },
    });
    if (existNickname) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    console.log(password);
    const encryptedPassword = await this.encryptPassword(password);
    console.log(encryptedPassword);
    const user = this.userRepository.create({
      email,
      nickname,
      password: encryptedPassword,
    });

    await this.userRepository.save(user);

    return user;
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

    if (user != null) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    return { message: '사용가능한 닉네임입니다.' };
  }

  async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(
      parseInt(this.configService.get<string>('SALT_OR_ROUNDS')),
    );

    return bcrypt.hashSync(password, salt);
  }
}
