import { sendSlackMessage } from './util/slack'
import * as bodyParser from 'body-parser'
import { CodefService } from './codef'
import { CredentialManager } from './credential'
import express, { type NextFunction, type Request, type Response } from 'express'

import serverless from 'serverless-http'
import { validateBody } from './util/validate'
import { MyVaccinationRequest } from './dto/my-vaccination'
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
import { type CodefChangePasswordResponse } from './dto/codef/change-password'

require('express-async-errors')

const app = express()

app.use(bodyParser.json())
app.use('/vaccination', verifyToken)
app.use('/reset-password', verifyToken)
app.use('/reset-password/challenge', verifyToken)
app.use('/signup', verifyToken)

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

    const result = await codefService.getMyVaccinationRecords(dto.id, dto.password)
    res.json(result)
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
      const response = await codefService.challengeSMS<CodefChangePasswordResponse>(token, dto, 'https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw')

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
      jobIndex: response.data.jobIndex,
      threadIndex: response.data.threadIndex,
      jti: response.data.jti,
      twoWayTimestamp: +response.data.twoWayTimestamp,
      expireAt: +response.data.twoWayTimestamp + 170,
      userName: dto.userName,
      identity: dto.identity,
      newPassword: codefService.encryptPassword(dto.newPassword),
      telecom: Telecom[dto.telecom].toString(),
      phoneNumber: dto.phoneNumber,
      type: 'CHANGE_PASSWORD'
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
      jobIndex: response.data.jobIndex,
      threadIndex: response.data.threadIndex,
      jti: response.data.jti,
      twoWayTimestamp: +response.data.twoWayTimestamp,
      expireAt: +response.data.twoWayTimestamp + 170,
      userName: dto.userName,
      identity: dto.identity,
      userId: dto.id,
      userPassword: codefService.encryptPassword(dto.password),
      telecom: Telecom[dto.telecom].toString(),
      phoneNumber: dto.phoneNumber,
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
