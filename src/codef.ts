import axios from 'axios'
import { type CodefTokenResponse } from './types/codef'
import { type Credential } from './types/credential'
import { CredentialManager } from './credential'
import NodeRSA from 'node-rsa'
import { DomainException } from './exceptions/DomainException'
import { ErrorCode } from './types/error'
import { plainToInstance } from 'class-transformer'
import { CodefMyVaccinationResponse } from './dto/codef/my-vaccination'
import { type CodefResponse } from './dto/codef/response'
import { MyVaccinationResponse } from './dto/my-vaccination'
import { type ChallengeRequest, type ResetPasswordRequest } from './dto/reset-password/reset-password'
import { type CodefChallengeResponse, CodefSecureNoResponse } from './dto/codef/change-password'
import { type RequestToken } from './types/token'
import { Telecom } from './dto/common/common'
import { type SignupRequest } from './dto/signup/signup'
import { CodefChallengeRegistrationFailed } from './exceptions/CodefChallengeRegistrationFailed'

export class CodefService {
  private readonly credentialManager = new CredentialManager()

  constructor (private credential: Credential) {
  }

  static async requestToken (clientId: string, clientSecret: string): Promise<string> {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await axios.post<CodefTokenResponse>(
      'https://oauth.codef.io/oauth/token?grant_type=client_credentials&scope=read',
      null,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      })

    return response.data.access_token
  }

  setCredential (credential: Credential): void {
    this.credential = credential
  }

  async challengeSMS (token: RequestToken, dto: ChallengeRequest, target: string): Promise<CodefChallengeResponse> {
    const response = await this.request(
      target,
      {
        organization: '0011',
        smsAuthNo: dto.code,
        ...token
      }
    ) as CodefChallengeResponse

    if (response.result.code === 'CF-00025') {
      throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)
    }

    if (response.result.code === 'CF-13300') {
      throw new DomainException(ErrorCode.SECURE_NO_ERROR)
    }

    if (response.result.code !== 'CF-00000') {
      throw new DomainException(ErrorCode.CODEF_ERROR, response.result)
    }

    if (response.data.resRegistrationStatus === '0') {
      throw new CodefChallengeRegistrationFailed(response.data)
    }

    return response
  }

  async challengeSecureNo (token: RequestToken, dto: ChallengeRequest, target: string): Promise<any> {
    const response = await this.request(
      target,
      {
        organization: '0011',
        ...token,
        secureNo: dto.code,
        secureNoRefresh: '0'
      }
    )

    if (response.result.code === 'CF-13301') {
      throw new DomainException(ErrorCode.SECURE_NO_ERROR)
    }

    if (response.result.code === 'CF-12834') {
      throw new DomainException(ErrorCode.PHONE_VERIFICATION_LOCK)
    }
    if (response.result.code === 'CF-00025') {
      throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)
    }

    if (response.result.code !== 'CF-03002') {
      throw new DomainException(ErrorCode.CODEF_ERROR, response.result)
    }

    return response
  }

  async requestResetPassword (dto: ResetPasswordRequest): Promise<CodefSecureNoResponse> {
    const response = await this.request(
      'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw',
      {
        organization: '0011',
        authMethod: '0',
        userName: dto.userName,
        identity: dto.identity,
        telecom: Telecom[dto.telecom].toString(),
        phoneNo: dto.phoneNumber,
        timeout: '170',
        userPassword: this.encryptPassword(dto.newPassword)
      }
    )

    if (response.result.code !== 'CF-03002') {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, response.result.extraMessage)
    }

    if (response.data.method === 'secureNo') {
      return plainToInstance(CodefSecureNoResponse, response)
    }

    throw new DomainException(ErrorCode.VALIDATION_ERROR, '인증번호를 받을 수 없습니다.')
  }

  async requestSignup (dto: SignupRequest): Promise<CodefSecureNoResponse> {
    const response = await this.request(
      'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/application-membership',
      {
        organization: '0011',
        authMethod: '0',
        userName: dto.userName,
        identity: dto.identity,
        telecom: Telecom[dto.telecom].toString(),
        phoneNo: dto.phoneNumber,
        timeout: '170',
        userId: dto.id,
        userPassword: this.encryptPassword(dto.password)
      }
    )

    if (response.result.code !== 'CF-03002') {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, response.result.extraMessage)
    }

    if (response.data.method === 'secureNo') {
      return plainToInstance(CodefSecureNoResponse, response)
    }

    throw new DomainException(ErrorCode.VALIDATION_ERROR, '인증번호를 받을 수 없습니다.')
  }

  async getMyVaccinationRecords (id: string, password: string): Promise<MyVaccinationResponse> {
    const response = await this.request('https://development.codef.io/v1/kr/public/hw/nip-cdc-list/my-vaccination', {
      organization: '0011',
      loginType: '1',
      userId: id,
      userPassword: this.encryptPassword(password),
      inquiryType: '0'
    }, true)

    if (response.result.code === 'CF-12100') {
      throw new DomainException(ErrorCode.ID_NOT_FOUND)
    }
    if (response.result.code === 'CF-12801') {
      throw new DomainException(ErrorCode.PASSWORD_ERROR)
    }
    if (response.result.code === 'CF-12066') {
      throw new DomainException(ErrorCode.RRN_REQUIRED)
    }
    if (response.result.code !== 'CF-00000') {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, response.result.extraMessage)
    }

    const codefResponse = plainToInstance(CodefMyVaccinationResponse, response)

    return MyVaccinationResponse.fromCodefResponse(codefResponse)
  }

  async registerRNN (rnn: string, id: string, password: string): Promise<boolean> {
    const response = await this.request(
      'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/application-additional-info',
      {
        organization: '0011',
        userId: id,
        userPassword: password,
        identity: rnn
      }
    )
    if (response.result.code === 'CF-12100') {
      throw new DomainException(ErrorCode.ID_NOT_FOUND)
    }
    if (response.result.code === 'CF-12801') {
      throw new DomainException(ErrorCode.PASSWORD_ERROR)
    }

    return true
  }

  public encryptPassword (password: string): string {
    const key = new NodeRSA()
    key.importKey(this.credential.publicKey, 'pkcs8-public')
    key.setOptions({ encryptionScheme: 'pkcs1' })

    return key.encrypt(password, 'base64')
  }

  private async request (url: string, data: any, replaceWhiteSpace = false): Promise<CodefResponse<any>> {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${this.credential.accessToken}`,
        Accept: 'application/json'
      },
      validateStatus: (status) => status < 500
    })

    if (response.data.code?.startsWith('CF-0999') === true) {
      this.credential = await this.credentialManager.refreshAccessToken(this.credential)

      return await this.request(url, data)
    }

    const body = response.data as string

    console.log(
      decodeURIComponent(body)
    )
    if (replaceWhiteSpace) {
      return JSON.parse(
        decodeURIComponent(body)
          .replace(/\+/g, ' ')
          .replace(/\\r\\n\s+상세보기/g, '')
      ) as CodefResponse<any>
    }

    return JSON.parse(
      decodeURIComponent(body)
    ) as CodefResponse<any>
  }
}
