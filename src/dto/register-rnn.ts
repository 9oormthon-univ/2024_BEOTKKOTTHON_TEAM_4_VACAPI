import { IsNotEmpty, IsString, Length, Matches } from 'class-validator'

export class RegisterRnnRequest {
  @IsString()
  @IsNotEmpty()
    id!: string

  @IsString()
  @IsNotEmpty()
    password!: string

  @IsNotEmpty()
  @Length(14, 14)
  @Matches(/^(?:[0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1,2][0-9]|3[0,1]))-[1-4][0-9]{6}$/)
    rnn!: string
}
