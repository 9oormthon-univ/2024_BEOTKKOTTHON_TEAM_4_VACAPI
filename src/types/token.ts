export type RequestToken = {
    userId: string;
    jobIndex: number;
    threadIndex: number;
    jti: string;
    twoWayTimestamp: number;
    expireAt: number;
    userName: string;
    identity: string;
    newPassword: string;
    telecom: number;
    phoneNumber: string;
    secureNo?: string;
}

