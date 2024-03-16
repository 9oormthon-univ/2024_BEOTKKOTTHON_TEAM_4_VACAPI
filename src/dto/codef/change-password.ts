import {CodefResponse} from "./response";

export class SecureNoData {
    jobIndex!: number;
    threadIndex!: number;
    jti!: string;
    twoWayTimestamp!: number;
    continue2Way!: boolean;
    extraInfo!: {
        reqSecureNo: string;
        reqSecureNoRefresh: string;
    };
    method!: string;
}

export class CodefSecureNoResponse extends CodefResponse<SecureNoData> {
}
