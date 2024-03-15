export type Credential = {
    id: string,
    publicKey: string,
    clientId: string,
    clientSecret: string,
    accessToken: string
}

export type DynamoDBCredentialItem = {
    id: { S: string },
    publicKey: { S: string },
    clientId: { S: string },
    clientSecret: { S: string },
    accessToken: { S: string }
}

export function isValidCredentialItem(item: any): item is DynamoDBCredentialItem {
    return (
        typeof item.clientId?.S === 'string' &&
        typeof item.clientSecret?.S === 'string' &&
        typeof item.id?.S === 'string' &&
        typeof item.publicKey?.S === 'string' &&
        typeof item.accessToken?.S === 'string'
    )
}
