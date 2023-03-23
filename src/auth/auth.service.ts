import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as firebase from 'firebase-admin';
import { User } from 'src/entities/user.entity';
import { FirebaseApp } from 'src/firebase/firebase-app';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private auth: firebase.auth.Auth;
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private firebaseApp: FirebaseApp,
    private mailerService: MailerService,
  ) {
    this.auth = firebaseApp.getAuth();
  }

  async signIn(id: number, firebaseId: string): Promise<object> {
    const firebaseUser = await this.auth.getUser(firebaseId);
    if (!firebaseUser) {
      throw new NotFoundException('가입된 계정이 아닙니다');
    }
    if (!firebaseUser.emailVerified) {
      throw new BadRequestException('이메일 인증이 되지 않았습니다');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 계정입니다');
    }

    return { message: '로그인 성공' };
  }

  async requestEmailVerification(email: string) {
    const user = await this.auth.getUserByEmail(email).catch((error) => {
      if (error['errorInfo']['code'] == 'auth/user-not-found') {
        throw new NotFoundException('가입된 회원이 아닙니다.');
      }
      throw new InternalServerErrorException(
        '유저 데이터를 불러오는데 실패했습니다.',
      );
    });

    if (user.emailVerified) {
      throw new BadRequestException('이미 인증된 이메일입니다.');
    }

    try {
      const emailLink = await this.auth.generateEmailVerificationLink(email);

      await this.mailerService.sendMail({
        from: '모하지스튜디오 그리니 <mohajistudio@gmail.com>',
        to: email,
        subject: '[그리니] 이메일 유효성 검사',
        html: `<h4>안녕하세요, 그리니 이메일 유효성 검사를 위한 메일입니다.</h4>
        <a href="${emailLink}"> 여기를 클릭해주세요 </a>`,
      });

      return { message: '이메일 인증을 완료해주세요' };
    } catch (error) {
      return new BadRequestException(error['errorInfo']['message']);
    }
  }

  async signUp(
    email: string,
    password: string,
    nickname: string,
  ): Promise<User> {
    const exist = await this.userRepository.findOneBy({ email });
    if (exist) {
      throw new BadRequestException('이미 존재하는 이메일입니다');
    }
    const firebaseUser = await this.auth
      .createUser({
        email,
        password,
        emailVerified: false,
        disabled: false,
      })
      .catch(() => {
        throw new BadRequestException('이미 존재하는 계정입니다');
      });

    const user = this.userRepository.create({
      email,
      nickname,
      firebaseId: firebaseUser.uid,
    });

    await this.userRepository.save(user);

    this.setId(firebaseUser.uid, user.id);

    return user;
  }

  async setId(uid: string, id: number) {
    await this.auth.setCustomUserClaims(uid, { id });
  }
}
