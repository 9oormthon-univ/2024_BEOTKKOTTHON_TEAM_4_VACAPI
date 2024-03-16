import { BaseResponse } from './response'

export class ErrorResponse extends BaseResponse<any> {
  code!: string

  constructor (message: string, code: string, field?: any) {
    super(false, message, field)
    this.code = code
  }
}
