import axios from "axios";
import {CodefResponse, CodefTokenResponse} from "./types/codef";
import {Credential} from "./types/credential";
import {CredentialManager} from "./credential";
import NodeRSA from "node-rsa";


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

    async getMyVaccinationRecords(id: string, password: string): Promise<any> {
        return this.request("https://development.codef.io/v1/kr/public/hw/nip-cdc-list/my-vaccination", {
            organization: "0011",
            loginType: "1",
            userId: id,
            userPassword: this.encryptPassword(password),
            inquiryType: "0"
        })
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

        return JSON.parse(decodeURIComponent(body).replace(/\+/g, ' ')) as CodefResponse<any>;
    }
}
