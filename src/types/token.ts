export interface BaseRequestToken {
  id: string
  authMethod: string
  expireAt: number
  userName: string
  identity: string
  secureNo?: string
  rnn?: string
  telecom: string
  phoneNo: string
  timeout: string
  type: 'CHANGE_PASSWORD' | 'SIGNUP'
  twoWayInfo: {
    jobIndex: number
    threadIndex: number
    jti: string
    twoWayTimestamp: number
  }
  is2Way: boolean
}

export type ChangePasswordRequestToken = BaseRequestToken & {
  userPassword: string
  type: 'CHANGE_PASSWORD'
}

export type SignupRequestToken = BaseRequestToken & {
  userId: string
  userPassword: string
  type: 'SIGNUP'
}

export type RequestToken = ChangePasswordRequestToken | SignupRequestToken
