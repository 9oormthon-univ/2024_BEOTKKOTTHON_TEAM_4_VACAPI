export type RequestToken = {
    userId: string;
    jobIndex: number;
    threadIndex: number;
    jti: string;
    twoWayTimestamp: number;
    expireAt: number;
}
