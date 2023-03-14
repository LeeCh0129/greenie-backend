import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { FirebaseApp } from 'src/firebase/firebase-app';
import * as firebase from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  private auth: firebase.auth.Auth;

  constructor(private firebaseApp: FirebaseApp) {
    this.auth = firebaseApp.getAuth();
  }

  async use(req: Request, res: Response, next: () => void) {
    const token: string = req.headers.authorization;
    if (token != null && token != '') {
      try {
        const decodedToken: DecodedIdToken = await this.auth.verifyIdToken(
          token.replace('Bearer ', ''),
        );
        req['user'] = {
          id: decodedToken['id'] || '',
          firebase_id: decodedToken['uid'] || '',
          email: decodedToken['email'] || '',
          roles: decodedToken['roles'] || '',
        };
      } catch {}
    }
    next();
  }
}
