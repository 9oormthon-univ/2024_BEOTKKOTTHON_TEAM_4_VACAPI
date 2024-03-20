import { type ChallengeResponseData } from '../dto/codef/change-password'

export class CodefChallengeRegistrationFailed extends Error {
  constructor (readonly payload: ChallengeResponseData) {
    super()

    Object.setPrototypeOf(this, CodefChallengeRegistrationFailed.prototype)
  }
}
