import { type RequestToken } from './types/token'
import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { client } from './dynamodb'

export class RequestTokenRepository {
  private readonly docClient = DynamoDBDocumentClient.from(client)

  public async saveToken (token: RequestToken): Promise<void> {
    const command = new PutItemCommand({
      TableName: 'requestTokensTable',
      Item: {
        userId: { S: token.userId },
        jobIndex: { N: token.jobIndex.toString() },
        threadIndex: { N: token.threadIndex.toString() },
        jti: { S: token.jti },
        twoWayTimestamp: { N: token.twoWayTimestamp.toString() },
        expireAt: { N: token.expireAt.toString() },
        userName: { S: token.userName },
        identity: { S: token.identity },
        newPassword: { S: token.newPassword },
        telecom: { S: token.telecom.toString() },
        phoneNumber: { S: token.phoneNumber },
        secureNo: { S: token.secureNo ?? '' }
      }
    })

    await this.docClient.send(command)
  }

  public async getToken (userId: string): Promise<RequestToken | null> {
    const { Item } = await this.docClient.send(
      new GetItemCommand({
        TableName: 'requestTokensTable',
        Key: {
          userId: { S: userId }
        }
      })
    )

    if (Item == null) return null
    if (
      (Item.userId.S == null) ||
            (Item.jobIndex.N == null) ||
            (Item.threadIndex.N == null) ||
            (Item.jti.S == null) ||
            (Item.twoWayTimestamp.N == null) ||
            (Item.expireAt.N == null) ||
            (Item.userName.S == null) ||
            (Item.identity.S == null) ||
            (Item.newPassword.S == null) ||
            (Item.telecom.S == null) ||
            (Item.phoneNumber.S == null)
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
