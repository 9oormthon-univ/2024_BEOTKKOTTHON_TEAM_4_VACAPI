import { type ErrorData } from '../types/error'

export class DomainException extends Error {
  constructor (readonly errorData: ErrorData, readonly data?: any) {
    super()

    Object.setPrototypeOf(this, DomainException.prototype)
  }
}
