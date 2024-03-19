import { type ChangePasswordRequestToken, type RequestToken, type SignupRequestToken } from './types/token'
import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { client } from './dynamodb'

export class RequestTokenRepository {
  private readonly docClient = DynamoDBDocumentClient.from(client)

  public async saveToken (token: RequestToken): Promise<void> {
    const command = new PutItemCommand({
      TableName: 'requestTokensTable',
      Item: {
        id: { S: token.id },
        expireAt: { N: token.expireAt.toString() },
        payload: { S: JSON.stringify(token) },
        type: { S: token.type }
      }
    })

    await this.docClient.send(command)
  }

  public async getToken (userId: string): Promise<RequestToken | null> {
    const { Item } = await this.docClient.send(
      new GetItemCommand({
        TableName: 'requestTokensTable',
        Key: {
          id: { S: userId }
        }
      })
    )

    if (Item == null) return null
    if (
      (Item.id.S == null) ||
            (Item.expireAt.N == null) ||
            (Item.payload.S == null) ||
            (Item.type.S == null)
    ) return null

    const payload = JSON.parse(Item.payload.S)
    if (Item.type.S === 'CHANGE_PASSWORD') {
      return payload as ChangePasswordRequestToken
    } else if (Item.type.S === 'SIGNUP') {
      return payload as SignupRequestToken
    } else {
      return null
    }
  }
}
