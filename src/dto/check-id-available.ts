import { IsNotEmpty, IsString } from 'class-validator'

export class CheckIdAvailable {
  @IsString()
  @IsNotEmpty()
    id!: string
}
