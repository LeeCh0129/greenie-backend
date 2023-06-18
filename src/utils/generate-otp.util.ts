import * as crypto from 'crypto';

export function generateOTP() {
  return crypto.randomBytes(4).toString('hex');
}
