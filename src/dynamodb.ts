import {DynamoDBClient} from "@aws-sdk/client-dynamodb";

export const client = new DynamoDBClient(process.env.IS_OFFLINE ? {
    region: process.env.AWS_REGION || 'localhost',
    endpoint: process.env.AWS_ENDPOINT || 'http://0.0.0.0:8000',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET || 'local'
    },
} : {})
