import { IsEnum, IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator'
import { type ChallengeType, Telecom } from '../common/common'

export class ResetPasswordRequest {
  @IsString()
  @IsNotEmpty()
    userName!: string

  @IsNotEmpty()
  @IsNumberString()
  @Length(9, 9)
    identity!: string

  @IsString()
  @IsNotEmpty()
  @Length(9, 20)
    newPassword!: string

  @IsString()
  @IsNotEmpty()
  @IsEnum(Telecom)
    telecom!: Telecom

  @IsNumberString()
  @IsNotEmpty()
  @Length(11, 11)
    phoneNumber!: string
}

export class RequestSMSRequest {
  @IsString()
  @IsNotEmpty()
    userName!: string

  @IsNotEmpty()
  @IsNumberString()
  @Length(9, 9)
    identity!: string

  @IsString()
  @IsNotEmpty()
  @Length(9, 20)
    newPassword!: string

  @IsString()
  @IsNotEmpty()
  @IsEnum(Telecom)
    telecom!: Telecom

  @IsNumberString()
  @IsNotEmpty()
  @Length(11, 11)
    phoneNumber!: string
}

export class ChallengeRequest {
  @IsNotEmpty()
  @IsString()
    type!: ChallengeType

  @IsNumberString()
  @IsNotEmpty()
    code!: string
}

export class ResetPasswordResponse {
  userId!: string
}
