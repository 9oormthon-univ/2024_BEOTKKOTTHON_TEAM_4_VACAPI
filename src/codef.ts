import axios from "axios";
import {CodefTokenResponse} from "./types/codef";
import {Credential} from "./types/credential";
import {CredentialManager} from "./credential";
import NodeRSA from "node-rsa";
import {DomainException} from "./exceptions/DomainException";
import {ErrorCode} from "./types/error";
import {plainToInstance} from "class-transformer";
import {CodefMyVaccinationResponse} from "./dto/codef/my-vaccination";
import {CodefResponse} from "./dto/codef/response";
import {MyVaccinationResponse} from "./dto/my-vaccination";
import {ChallengeRequest, ResetPasswordRequest, Telecom} from "./dto/reset-password/reset-password";
import {CodefChangePasswordResponse, CodefSecureNoResponse} from "./dto/codef/change-password";
import {RequestToken} from "./types/token";


export class CodefService {
    private credentialManager = new CredentialManager()

    constructor(private credential: Credential) {
    }

    static async requestToken(clientId: string, clientSecret: string): Promise<string> {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

        const response = await axios.post<CodefTokenResponse>(
            "https://oauth.codef.io/oauth/token?grant_type=client_credentials&scope=read",
            null,
            {
                headers: {
                    "Authorization": `Basic ${auth}`,
                }
            })

        return response.data.access_token
    }

    setCredential(credential: Credential) {
        this.credential = credential
    }


    async challengeSMS(token: RequestToken, dto: ChallengeRequest): Promise<CodefChangePasswordResponse> {
        const response = await this.request(
            "https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw",
            {
                organization: "0011",
                authMethod: "0",
                userName: token.userName,
                identity: token.identity,
                telecom: token.telecom,
                phoneNo: token.phoneNumber,
                userPassword: token.newPassword,
                smsAuthNo: dto.code,
                secureNo: token.secureNo,
                secureNoRefresh: "0",
                is2Way: true,
                twoWayInfo: {
                    jobIndex: token.jobIndex,
                    threadIndex: token.threadIndex,
                    jti: token.jti,
                    twoWayTimestamp: token.twoWayTimestamp,
                }
            }
        ) as CodefChangePasswordResponse

        if (response.result.code == "CF-00025")
            throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)

        if (response.result.code == "CF-13300")
            throw new DomainException(ErrorCode.SECURE_NO_ERROR)

        if (response.result.code != "CF-00000")
            throw new DomainException(ErrorCode.CODEF_ERROR, response.result)

        if (response.data.resRegistrationStatus == "0")
            throw new DomainException(ErrorCode.REGISTER_FIRST, response.data.resResultDesc)

        return response;
    }

    async challengeSecureNo(token: RequestToken, dto: ChallengeRequest): Promise<any> {
        const response = await this.request(
            "https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw",
            {
                organization: "0011",
                authMethod: "0",
                userName: token.userName,
                identity: token.identity,
                telecom: token.telecom,
                phoneNo: token.phoneNumber,
                userPassword: token.newPassword,
                secureNo: dto.code,
                secureNoRefresh: "0",
                is2Way: true,
                twoWayInfo: {
                    jobIndex: token.jobIndex,
                    threadIndex: token.threadIndex,
                    jti: token.jti,
                    twoWayTimestamp: token.twoWayTimestamp,
                }
            }
        )

        if (response.result.code == "CF-13301")
            throw new DomainException(ErrorCode.SECURE_NO_ERROR)

        if (response.result.code == "CF-12834")
            throw new DomainException(ErrorCode.PHONE_VERIFICATION_LOCK)
        if (response.result.code == "CF-00025")
            throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)

        if (response.result.code != "CF-03002")
            throw new DomainException(ErrorCode.CODEF_ERROR, response.result)

        return response;
    }

    async requestResetPassword(dto: ResetPasswordRequest): Promise<CodefSecureNoResponse> {
        const response = await this.request(
            "https://development.codef.io/v1/kr/public/hw/nip-cdc-list/finding-id-pw",
            {
                organization: "0011",
                authMethod: "0",
                userName: dto.userName,
                identity: dto.identity,
                telecom: Telecom[dto.telecom].toString(),
                phoneNo: dto.phoneNumber,
                timeout: "170",
                userPassword: this.encryptPassword(dto.newPassword)
            }
        )

        if (response.result.code != "CF-03002")
            throw new DomainException(ErrorCode.VALIDATION_ERROR, response.result.extraMessage)

        if (response.data.method == "secureNo") {
            return plainToInstance(CodefSecureNoResponse, response)
        }

        throw new DomainException(ErrorCode.VALIDATION_ERROR, "인증번호를 받을 수 없습니다.")
    }

    async getMyVaccinationRecords(id: string, password: string): Promise<MyVaccinationResponse> {
        const response = await this.request("https://development.codef.io/v1/kr/public/hw/nip-cdc-list/my-vaccination", {
            organization: "0011",
            loginType: "1",
            userId: id,
            userPassword: this.encryptPassword(password),
            inquiryType: "0"
        })

        if (response.result.code == "CF-12100")
            throw new DomainException(ErrorCode.ID_NOT_FOUND)

        if (response.result.code != "CF-00000")
            throw new DomainException(ErrorCode.VALIDATION_ERROR, response.result.extraMessage)

        const codefResponse = plainToInstance(CodefMyVaccinationResponse, response)

        return MyVaccinationResponse.fromCodefResponse(codefResponse)
    }

    public encryptPassword(password: string): string {
        const key = new NodeRSA();
        key.importKey(this.credential.publicKey, 'pkcs8-public');
        key.setOptions({encryptionScheme: 'pkcs1'});

        return key.encrypt(password, "base64")
    }

    private async request(url: string, data: any): Promise<CodefResponse<any>> {
        const response = await axios.post(url, data, {
            headers: {
                "Authorization": `Bearer ${this.credential.accessToken}`
            },
            validateStatus: (status) => status < 500
        })

        const body = response.data
        if (body.error && body.code.startsWith("CF-0999")) {
            this.credential = await this.credentialManager.refreshAccessToken(this.credential)

            return this.request(url, data)
        }

        return JSON.parse(
            decodeURIComponent(body)
                .replace(/\\r\\n\s+상세보기/g, '')
        ) as CodefResponse<any>;
    }
}
