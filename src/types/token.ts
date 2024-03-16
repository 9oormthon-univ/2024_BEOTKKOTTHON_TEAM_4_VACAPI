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
    telecom: string;
    phoneNumber: string;
    secureNo?: string;
}

