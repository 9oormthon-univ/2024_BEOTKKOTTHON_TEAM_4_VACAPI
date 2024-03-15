import {DynamoDBClient, ScanCommand} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {Credential, isValidCredentialItem} from "./types/credential";
import {CredentialException} from "./exceptions/CredentialException";
import {CodefService} from "./codef";

export class CredentialManager {
    private client = new DynamoDBClient({
        region: process.env.AWS_REGION || 'localhost',
        endpoint: process.env.AWS_ENDPOINT || 'http://0.0.0.0:8000',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
            secretAccessKey: process.env.AWS_SECRET || 'local'
        },
    })

    private docClient = DynamoDBDocumentClient.from(this.client);


    async getCredential(): Promise<Credential> {
        const {Items} = await this.docClient.send(
            new ScanCommand({
                TableName: "credentialsTable"
            })
        )
        if (!Items || !isValidCredentialItem(Items[0])) throw new CredentialException("사용 가능한 Credential이 없습니다.")

        return {
            id: Items[0].id.S,
            publicKey: Items[0].publicKey.S,
            clientId: Items[0].clientId.S,
            clientSecret: Items[0].clientSecret.S,
            accessToken: Items[0].accessToken.S
        }
    }


    async refreshAccessToken(credential: Credential): Promise<Credential> {
        const accessToken = await CodefService.requestToken(credential.clientId, credential.clientSecret)

        await this.docClient.send(
            new UpdateCommand({
                TableName: "credentialsTable",
                Key: {
                    id: credential.id
                },
                UpdateExpression: "set accessToken = :accessToken",
                ExpressionAttributeValues: {
                    ":accessToken": accessToken,
                }
            })
        )

        return {
            ...credential,
            accessToken
        }
    }
}
