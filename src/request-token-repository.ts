import {RequestToken} from "./types/token";
import {DynamoDBClient, GetItemCommand, PutItemCommand} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";

export class RequestTokenRepository {
    private client = new DynamoDBClient({
        region: process.env.AWS_REGION || 'localhost',
        endpoint: process.env.AWS_ENDPOINT || 'http://0.0.0.0:8000',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
            secretAccessKey: process.env.AWS_SECRET || 'local'
        },
    })

    private docClient = DynamoDBDocumentClient.from(this.client);

    public async saveToken(token: RequestToken): Promise<void> {
        const command = new PutItemCommand({
            TableName: "requestTokensTable",
            Item: {
                userId: {S: token.userId},
                jobIndex: {N: token.jobIndex.toString()},
                threadIndex: {N: token.threadIndex.toString()},
                jti: {S: token.jti},
                twoWayTimestamp: {N: token.twoWayTimestamp.toString()},
                expireAt: {N: token.expireAt.toString()},
                userName: {S: token.userName},
                identity: {S: token.identity},
                newPassword: {S: token.newPassword},
                telecom: {S: token.telecom},
                phoneNumber: {S: token.phoneNumber},
                secureNo: {S: token.secureNo ?? ""},
            },
        })

        await this.docClient.send(command)
    }

    public async getToken(userId: string): Promise<RequestToken | null> {
        const {Item} = await this.docClient.send(
            new GetItemCommand({
                TableName: "requestTokensTable",
                Key: {
                    userId: {S: userId}
                }
            })
        )

        if (!Item) return null
        if (
            !Item.userId.S ||
            !Item.jobIndex.N ||
            !Item.threadIndex.N ||
            !Item.jti.S ||
            !Item.twoWayTimestamp.N ||
            !Item.expireAt.N ||
            !Item.userName.S ||
            !Item.identity.S ||
            !Item.newPassword.S ||
            !Item.telecom.S ||
            !Item.phoneNumber.S
        ) return null

        return {
            userId: Item.userId.S,
            jobIndex: parseInt(Item.jobIndex.N),
            threadIndex: parseInt(Item.threadIndex.N),
            jti: Item.jti.S,
            twoWayTimestamp: parseInt(Item.twoWayTimestamp.N),
            expireAt: parseInt(Item.expireAt.N),
            userName: Item.userName.S,
            identity: Item.identity.S,
            newPassword: Item.newPassword.S,
            telecom: Item.telecom.S,
            phoneNumber: Item.phoneNumber.S,
            secureNo: Item.secureNo.S
        }
    }
}
