import {ChallengeType} from "./reset-password";

export class SecureNoResponse {
    secureNoImage!: string;
    validUntil!: number;
    type: ChallengeType = "SECURE_NO";
}
