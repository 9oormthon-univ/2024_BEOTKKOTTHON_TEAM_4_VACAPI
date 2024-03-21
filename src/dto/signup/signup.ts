import { IsEnum, IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator'
import { Telecom } from '../common/common'

export class SignupRequest {
  @IsString()
  @IsNotEmpty()
    userName!: string

  @IsNotEmpty()
  @IsNumberString()
  @Length(9, 9)
    identity!: string

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
