export interface BaseRequestToken {
  id: string
  jobIndex: number
  threadIndex: number
  jti: string
  twoWayTimestamp: number
  expireAt: number
  userName: string
  identity: string
  secureNo?: string
  telecom: string
  phoneNumber: string
  type: 'CHANGE_PASSWORD' | 'SIGNUP'
}

export type ChangePasswordRequestToken = BaseRequestToken & {
  newPassword: string
  type: 'CHANGE_PASSWORD'
}

export type SignupRequestToken = BaseRequestToken & {
  userId: string
  userPassword: string
  type: 'SIGNUP'
}

export type RequestToken = ChangePasswordRequestToken | SignupRequestToken
