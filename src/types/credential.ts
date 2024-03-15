export type Credential = {
    id: string,
    publicKey: string,
    clientId: string,
    clientSecret: string,
    isValid: boolean,
    isActivated: boolean
}

export type DynamoDBCredentialItem = {
    id: { S: string },
    publicKey: { S: string },
    clientId: { S: string },
    clientSecret: { S: string },
    isValid: { BOOL: boolean },
    isActivated: { BOOL: boolean }
}

export function isValidCredentialItem(item: any): item is DynamoDBCredentialItem {
    return (
        typeof item.clientId?.S === 'string' &&
        typeof item.clientSecret?.S === 'string' &&
        typeof item.id?.S === 'string' &&
        typeof item.publicKey?.S === 'string' &&
        typeof item.isValid?.BOOL === 'boolean' &&
        typeof item.isActivated?.BOOL === 'boolean'
    )
}
