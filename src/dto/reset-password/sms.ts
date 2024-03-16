import {ChallengeType} from "./reset-password";

export class SmsResponse {
    type: ChallengeType = "SMS";
    validUntil!: number;
}
