import { Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import * as serviceAccountKey from './serviceAccountKey.json';

const firebase_params = {
  type: serviceAccountKey.type,
  projectId: serviceAccountKey.project_id,
  privateKeyId: serviceAccountKey.private_key_id,
  privateKey: serviceAccountKey.private_key,
  clientEmail: serviceAccountKey.client_email,
  clientId: serviceAccountKey.client_id,
  authUri: serviceAccountKey.auth_uri,
  tokenUri: serviceAccountKey.token_uri,
  authProviderX509CertUrl: serviceAccountKey.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccountKey.client_x509_cert_url,
};

@Injectable()
export class FirebaseApp {
  private firebaseApp: firebase.app.App;

  constructor() {
    this.firebaseApp = firebase.initializeApp({
      credential: firebase.credential.cert(firebase_params),
    });
  }

  getAuth = (): firebase.auth.Auth => {
    return this.firebaseApp.auth();
  };
}
