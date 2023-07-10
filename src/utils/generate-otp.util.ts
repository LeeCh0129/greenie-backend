import * as crypto from 'crypto';

export function generateOTP(prefix: string) {
  return prefix + crypto.randomBytes(4).toString('hex');
}
