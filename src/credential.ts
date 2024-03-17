import { ScanCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { type Credential, isValidCredentialItem } from './types/credential'
import { CodefService } from './codef'
import { DomainException } from './exceptions/DomainException'
import { ErrorCode } from './types/error'
import { client } from './dynamodb'

export class CredentialManager {
  private readonly docClient = DynamoDBDocumentClient.from(client)

  async getCredential (): Promise<Credential> {
    const { Items } = await this.docClient.send(
      new ScanCommand({
        TableName: 'credentialsTable'
      })
    )
    if ((Items == null) || !isValidCredentialItem(Items[0])) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR
      )
    }

    return {
      id: Items[0].id.S,
      publicKey: Items[0].publicKey.S,
      clientId: Items[0].clientId.S,
      clientSecret: Items[0].clientSecret.S,
      accessToken: Items[0].accessToken.S
    }
  }

  async refreshAccessToken (credential: Credential): Promise<Credential> {
    const accessToken = await CodefService.requestToken(credential.clientId, credential.clientSecret)

    await this.docClient.send(
      new UpdateCommand({
        TableName: 'credentialsTable',
        Key: {
          id: credential.id
        },
        UpdateExpression: 'set accessToken = :accessToken',
        ExpressionAttributeValues: {
          ':accessToken': accessToken
        }
      })
    )

    return {
      ...credential,
      accessToken
    }
  }
}
