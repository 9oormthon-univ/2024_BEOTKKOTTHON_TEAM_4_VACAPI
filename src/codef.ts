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
import {ResetPasswordRequest, Telecom} from "./dto/reset-password/reset-password";
import {CodefSecureNoResponse} from "./dto/codef/change-password";


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

    private encryptPassword(password: string): string {
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
                .replace(/\+/g, ' ')
                .replace(/\\r\\n\s+상세보기/g, '')
        ) as CodefResponse<any>;
    }
}
