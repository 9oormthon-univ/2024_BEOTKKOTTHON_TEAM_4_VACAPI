import { CodefResponse } from './response'

export class ChallengeResponseData {
  resRegistrationStatus!: '1' | '0'
  resResultDesc!: string
}

export class CodefChallengeResponse extends CodefResponse<ChallengeResponseData> {
}
