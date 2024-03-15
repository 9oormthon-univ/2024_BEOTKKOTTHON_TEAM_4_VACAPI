import {DynamoDBClient, ScanCommand} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {Credential, isValidCredentialItem} from "./types/credential";
import {CredentialException} from "./exceptions/CredentialException";

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

    async fetchCredentials(): Promise<Credential[]> {
        const {Items} = await this.docClient.send(
            new ScanCommand({
                TableName: "credentialsTable"
            })
        )

        if (!Items) throw new CredentialException("사용 가능한 Credential이 없습니다.")

        return Items.map(item => {
            if (isValidCredentialItem(item)) {
                return {
                    id: item.id.S,
                    publicKey: item.publicKey.S,
                    clientId: item.clientId.S,
                    clientSecret: item.clientSecret.S,
                    isValid: item.isValid.BOOL,
                    isActivated: item.isActivated.BOOL
                }
            } else {
                return null
            }
        }).filter(item => item != null) as Credential[]
    }

    async getActiveCredential(): Promise<Credential> {
        const credentials = await this.fetchCredentials()
        const activeCredentials = credentials.filter(
            credential => credential.isActivated && credential.isValid
        )

        if (activeCredentials.length === 0) {
            const validCredentials = await this.getValidCredentials()
            if (validCredentials.length === 0) {
                throw new CredentialException("사용 가능한 Credential이 없습니다.")
            }

            await this.activateCredential(validCredentials[0].id)

            return validCredentials[0]
        }

        return activeCredentials[0]
    }

    async getValidCredentials(): Promise<Credential[]> {
        const credentials = await this.fetchCredentials()
        return credentials.filter(credential => credential.isValid)
    }

    async invalidateCredential(id: string): Promise<void> {
        await this.docClient.send(
            new UpdateCommand({
                TableName: "credentialsTable",
                Key: {
                    id: id
                },
                UpdateExpression: "set isActivated = :isActivated, isValid = :isValid",
                ExpressionAttributeValues: {
                    ":isActivated": false,
                    ":isValid": false
                }
            })
        )
    }

    async activateCredential(id: string): Promise<void> {
        await this.docClient.send(
            new UpdateCommand({
                TableName: "credentialsTable",
                Key: {
                    id: id
                },
                UpdateExpression: "set isActivated = :isActivated",
                ExpressionAttributeValues: {
                    ":isActivated": true,
                }
            })
        )
    }

    async refreshCredential(id: string): Promise<void> {
        await this.docClient.send(
            new UpdateCommand({
                TableName: "credentialsTable",
                Key: {
                    id: id
                },
                UpdateExpression: "set isValid = :isValid",
                ExpressionAttributeValues: {
                    ":isValid": true,
                }
            })
        )
    }

    async refreshCredentials(): Promise<void> {
        const credentials = await this.fetchCredentials()
        for (const credential of credentials) {
            await this.refreshCredential(credential.id)
        }
    }
}
