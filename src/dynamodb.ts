import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

export const client = new DynamoDBClient((process.env.IS_OFFLINE == null)
  ? {}
  : {
      region: 'localhost',
      endpoint: 'http://0.0.0.0:8000',
      credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
      }
    })
