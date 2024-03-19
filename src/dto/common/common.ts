export enum Telecom {
  SKT = 0,
  KT,
  LG,
  SKT_MVNO,
  KT_MVNO,
  LG_MVNO
}

export type ChallengeType = 'SECURE_NO' | 'SMS'

export class ChallengeResponse<T> {
  type!: ChallengeType
  data!: T
}

export class SecureNoResponse {
  secureNoImage!: string
  type: ChallengeType = 'SECURE_NO'
}

export class SmsResponse {
  type: ChallengeType = 'SMS'
  validUntil!: number
}
