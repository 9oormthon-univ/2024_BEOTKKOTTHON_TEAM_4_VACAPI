import { sendSlackMessage } from './util/slack'
import * as bodyParser from 'body-parser'
import { CodefService } from './codef'
import { CredentialManager } from './credential'
import express, { type NextFunction, type Request, type Response } from 'express'

import serverless from 'serverless-http'
import { validateBody } from './util/validate'
import { MyVaccinationRequest, type MyVaccinationResponse } from './dto/my-vaccination'
import { DomainException } from './exceptions/DomainException'
import { ErrorResponse } from './dto/error'
import { ChallengeRequest, ResetPasswordRequest, type ResetPasswordResponse } from './dto/reset-password/reset-password'
import { BaseResponse } from './dto/response'
import { type ChangePasswordRequestToken, type SignupRequestToken } from './types/token'
import { RequestTokenRepository } from './request-token-repository'
import { ErrorCode } from './types/error'
import { verifyToken } from './util/auth'
import jwt from 'jsonwebtoken'
import { type SecureNoResponse, type SmsResponse, Telecom } from './dto/common/common'
import { SignupRequest } from './dto/signup/signup'
import { Crawler } from './crawler'
import { CodefChallengeRegistrationFailed } from './exceptions/CodefChallengeRegistrationFailed'
import { parseUserIdFromDesc } from './util/signup'
import { RegisterRnnRequest } from './dto/register-rnn'
import { CheckIdAvailable } from './dto/check-id-available'

require('express-async-errors')

const app = express()

app.use(bodyParser.json())
app.use('/vaccination', verifyToken)
app.use('/reset-password', verifyToken)
app.use('/reset-password/challenge', verifyToken)
app.use('/signup', verifyToken)
app.use('/signup/challenge', verifyToken)

app.get('/', (req, res) => {
  res.send('VACAPI 💉🐻‍❄️')
})

app.get('/token', (req, res) => {
  if (process.env.JWT_SECRET == null) throw new Error('JWT_SECRET is not defined')

  const userId = 'testuser'
  res.send(jwt.sign({ subject: userId }, process.env.JWT_SECRET))
})

app.post('/vaccination', validateBody(MyVaccinationRequest),
  async (req: Request & {
    body: MyVaccinationRequest
  }, res: Response) => {
    const dto: MyVaccinationRequest = req.body

    const credentialManager = new CredentialManager()
    const credential = await credentialManager.getCredential()
    const codefService = new CodefService(credential)
    const crawler = new Crawler()

    const result = await codefService.getMyVaccinationRecords(dto.id, dto.password)
    const hpv = await crawler.getHPV(dto.id, dto.password)

    const merged: MyVaccinationResponse = {
      ...result,
      vaccineList: [
        ...result.vaccineList,
        ...hpv
      ]
    }

    res.json(merged)
  })

app.post('/reset-password/challenge', validateBody(ChallengeRequest),
  async (req: Request & {
    body: ChallengeRequest
  }, res: Response) => {
    const dto: ChallengeRequest = req.body
    const requestTokenRepository = new RequestTokenRepository()

    const userId = req.userId
    if (userId == null) throw new DomainException(ErrorCode.AUTH_MISSING)

    const token = await requestTokenRepository.getToken(userId)
    if (token == null || token.type !== 'CHANGE_PASSWORD') throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)

    const credentialManager = new CredentialManager()
    const credential = await credentialManager.getCredential()
    const codefService = new CodefService(credential)

    let data

    if (dto.type === 'SMS') {
      if (token.secureNo == null) throw new DomainException(ErrorCode.NO_CHALLENGE_SECURE_CODE)
      const response = await codefService.challengeSMS(token, dto, 'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw')

      data = new BaseResponse<ResetPasswordResponse>(
        true,
        '비밀번호 변경 완료',
        {
          userId: response.data.resLoginId
        }
      )
    } else if (dto.type === 'SECURE_NO') {
      await codefService.challengeSecureNo(token, dto, 'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw')

      await requestTokenRepository.saveToken(
        {
          ...token,
          secureNo: dto.code
        }
      )

      data = new BaseResponse<SmsResponse>(
        true,
        '요청이 완료되었습니다.',
        {
          type: 'SMS',
          validUntil: token.expireAt
        }
      )
    } else {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'SMS, SECURE_NO 중 하나를 선택해주세요.')
    }

    res.json(data)
  })

app.post('/reset-password', validateBody(ResetPasswordRequest),
  async (req: Request & { body: ResetPasswordRequest }, res: Response): Promise<void> => {
    const userId = req.userId
    if (userId == null) throw new DomainException(ErrorCode.AUTH_MISSING)

    const dto: ResetPasswordRequest = req.body

    const requestTokenRepository = new RequestTokenRepository()

    const credentialManager = new CredentialManager()
    const credential = await credentialManager.getCredential()
    const codefService = new CodefService(credential)

    const response = await codefService.requestResetPassword(dto)

    const token: ChangePasswordRequestToken = {
      id: userId,
      twoWayInfo: {
        jobIndex: response.data.jobIndex,
        threadIndex: response.data.threadIndex,
        jti: response.data.jti,
        twoWayTimestamp: +response.data.twoWayTimestamp
      },
      expireAt: +response.data.twoWayTimestamp + 170,
      userName: dto.userName,
      identity: dto.identity,
      newPassword: codefService.encryptPassword(dto.newPassword),
      telecom: Telecom[dto.telecom].toString(),
      phoneNo: dto.phoneNumber,
      timeout: '170',
      authMethod: '0',
      type: 'CHANGE_PASSWORD',
      is2Way: true
    }

    await requestTokenRepository.saveToken(token)

    res.json(
      new BaseResponse<SecureNoResponse>(true, '보안 코드를 입력해주세요.', {
        secureNoImage: response.data.extraInfo.reqSecureNo,
        type: 'SECURE_NO'
      })
    )
  }
)

app.post('/check-id-available', validateBody(CheckIdAvailable), async (req: Request & {
  body: CheckIdAvailable
}, res: Response) => {
  const crawler = new Crawler()

  const dto = req.body as CheckIdAvailable
  res.json(
    new BaseResponse(true, '조회가 완료되었습니다.', {
      isAvailable: await crawler.isIDAvaliable(dto.id)
    })
  )
})

app.post('/register-rnn', validateBody(RegisterRnnRequest), async (req: Request & {
  body: RegisterRnnRequest
}, res: Response) => {
  const credentialManager = new CredentialManager()
  const credential = await credentialManager.getCredential()
  const codefService = new CodefService(credential)

  const dto: RegisterRnnRequest = req.body

  try {
    await codefService.registerRNN(dto.rnn, dto.id, codefService.encryptPassword(dto.password))

    res.json(new BaseResponse<any>(true, '등록 완료'))
  } catch (e) {
    if (e instanceof DomainException) throw e
    throw new DomainException(ErrorCode.RNN_REGISTER_FAILED)
  }
})

app.post('/signup', validateBody(SignupRequest),
  async (req: Request & { body: SignupRequest }, res: Response): Promise<void> => {
    const userId = req.userId
    if (userId == null) throw new DomainException(ErrorCode.AUTH_MISSING)

    const dto: SignupRequest = req.body

    const requestTokenRepository = new RequestTokenRepository()

    const credentialManager = new CredentialManager()
    const credential = await credentialManager.getCredential()
    const codefService = new CodefService(credential)

    const response = await codefService.requestSignup(dto)

    const token: SignupRequestToken = {
      id: userId,
      twoWayInfo: {
        jobIndex: response.data.jobIndex,
        threadIndex: response.data.threadIndex,
        jti: response.data.jti,
        twoWayTimestamp: +response.data.twoWayTimestamp
      },
      expireAt: +response.data.twoWayTimestamp + 3000,
      userName: dto.userName,
      identity: dto.identity,
      userId: dto.id,
      userPassword: codefService.encryptPassword(dto.password),
      telecom: Telecom[dto.telecom].toString(),
      phoneNo: dto.phoneNumber,
      timeout: '170',
      authMethod: '0',
      is2Way: true,
      type: 'SIGNUP'
    }

    await requestTokenRepository.saveToken(token)

    res.json(
      new BaseResponse<SecureNoResponse>(true, '보안 코드를 입력해주세요.', {
        secureNoImage: response.data.extraInfo.reqSecureNo,
        type: 'SECURE_NO'
      })
    )
  }
)

app.post('/reset-password/secureNo', async (req: Request, res: Response) => {
  const requestTokenRepository = new RequestTokenRepository()

  const credentialManager = new CredentialManager()
  const credential = await credentialManager.getCredential()
  const codefService = new CodefService(credential)

  const userId = req.userId
  if (userId == null) throw new DomainException(ErrorCode.AUTH_MISSING)

  const token = await requestTokenRepository.getToken(userId)
  if (token == null || token.type !== 'SIGNUP') throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)

  const response = await codefService.requestNewSecureNo(token,
    'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw')

  res.json(
    new BaseResponse<SecureNoResponse>(true, '보안 코드를 입력해주세요.', {
      secureNoImage: response.data.extraInfo.reqSecureNo,
      type: 'SECURE_NO'
    })
  )
})

app.post('/signup/secureNo', async (req: Request, res: Response) => {
  const requestTokenRepository = new RequestTokenRepository()

  const credentialManager = new CredentialManager()
  const credential = await credentialManager.getCredential()
  const codefService = new CodefService(credential)

  const userId = req.userId
  if (userId == null) throw new DomainException(ErrorCode.AUTH_MISSING)

  const token = await requestTokenRepository.getToken(userId)
  if (token == null || token.type !== 'SIGNUP') throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)

  const response = await codefService.requestNewSecureNo(token,
    'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/application-membership')

  res.json(
    new BaseResponse<SecureNoResponse>(true, '보안 코드를 입력해주세요.', {
      secureNoImage: response.data.extraInfo.reqSecureNo,
      type: 'SECURE_NO'
    })
  )
})

app.post('/signup/challenge', validateBody(ChallengeRequest),
  async (req: Request & {
    body: ChallengeRequest
  }, res: Response) => {
    const dto: ChallengeRequest = req.body
    const requestTokenRepository = new RequestTokenRepository()

    const userId = req.userId
    if (userId == null) throw new DomainException(ErrorCode.AUTH_MISSING)

    const token = await requestTokenRepository.getToken(userId)
    if (token == null || token.type !== 'SIGNUP') throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)

    const credentialManager = new CredentialManager()
    const credential = await credentialManager.getCredential()
    const codefService = new CodefService(credential)

    let data

    if (dto.type === 'SMS') {
      if (token.secureNo == null) throw new DomainException(ErrorCode.NO_CHALLENGE_SECURE_CODE)

      try {
        const response = await codefService.challengeSMS(token, dto, 'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/application-membership')

        data = new BaseResponse<any>(
          true,
          '회원가입 완료'
        )

        res.json(data)
      } catch (e) {
        if (e instanceof CodefChallengeRegistrationFailed) {
          throw new DomainException(ErrorCode.USER_ALREADY_REGISTERED, {
            userId: parseUserIdFromDesc(e.payload.resResultDesc)
          })
        } else {
          throw e
        }
      }
    } else if (dto.type === 'SECURE_NO') {
      await codefService.challengeSecureNo(token, dto, 'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/application-membership')

      await requestTokenRepository.saveToken(
        {
          ...token,
          secureNo: dto.code
        }
      )

      data = new BaseResponse<SmsResponse>(
        true,
        '요청이 완료되었습니다.',
        {
          type: 'SMS',
          validUntil: token.expireAt
        }
      )
      res.json(data)
    } else {
      throw new DomainException(ErrorCode.VALIDATION_ERROR, 'SMS, SECURE_NO 중 하나를 선택해주세요.')
    }
  })

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof DomainException) {
    res.status(400).json(
      new ErrorResponse(
        err.errorData.message,
        err.errorData.code,
        err.data
      )
    )
  } else {
    sendSlackMessage(JSON.stringify(err))
    console.log(err)
    res.status(500).json(
      new ErrorResponse(
        '서버 에러',
        'SERVER_ERROR'
      )
    )
    next()
  }
})

module.exports.handler = serverless(app)
