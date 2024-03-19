import { type ChallengeType } from './reset-password'

export class SecureNoResponse {
  secureNoImage!: string
  type: ChallengeType = 'SECURE_NO'
}
