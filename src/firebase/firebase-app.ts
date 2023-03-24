import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as firebase from 'firebase-admin';

@Injectable()
export class FirebaseApp {
  private firebaseApp: firebase.app.App;
  constructor(private configService: ConfigService) {
    this.firebaseApp = firebase.initializeApp({
      credential: firebase.credential.cert({
        projectId: this.configService.get<string>('PROJECT_ID'),
        privateKey: this.configService
          .get<string>('PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
        clientEmail: this.configService.get<string>('CLIENT_EMAIL'),
      }),
    });
  }

  getAuth = (): firebase.auth.Auth => {
    return this.firebaseApp.auth();
  };
}
