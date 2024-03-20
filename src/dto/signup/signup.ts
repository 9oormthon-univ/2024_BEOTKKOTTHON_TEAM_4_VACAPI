import { IsEnum, IsNotEmpty, IsNumberString, IsString, Length, Matches } from 'class-validator'
import { Telecom } from '../common/common'

export class SignupRequest {
  @IsString()
  @IsNotEmpty()
    userName!: string

  @IsNotEmpty()
  @Length(14, 14)
  @Matches(/^(?:[0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1,2][0-9]|3[0,1]))-[1-4][0-9]{6}$/)
    rnn!: string

  @IsString()
  @IsNotEmpty()
    id!: string

  @IsString()
  @IsNotEmpty()
  @Length(9, 20)
    password!: string

  @IsString()
  @IsNotEmpty()
  @IsEnum(Telecom)
    telecom!: Telecom

  @IsNumberString()
  @IsNotEmpty()
  @Length(11, 11)
    phoneNumber!: string
}
