import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-firebase-jwt';
import * as firebase from 'firebase-admin';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { FirebaseApp } from './firebase-app';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(
  Strategy,
  'firebase-auth',
) {
  private auth: firebase.auth.Auth;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private firebaseApp: FirebaseApp,
  ) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() });
    this.auth = firebaseApp.getAuth();
  }

  async validate(token: string) {
    const firebaseUser: DecodedIdToken = await this.auth
      .verifyIdToken(token, true)
      .catch((error) => {
        throw new UnauthorizedException(error.toString());
      });
    if (!firebaseUser) {
      throw new UnauthorizedException('token is not validate');
    }
    const user = await this.userRepository.findOneBy({
      firebase_id: firebaseUser.uid,
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }
}
