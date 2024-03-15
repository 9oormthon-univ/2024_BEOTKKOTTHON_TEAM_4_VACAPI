export type CodefTokenResponse = {
    access_token: string,
}


export type CodefResponse<T> = {
    result: {
        code: string,
        extraMessage: string,
        message: string,
        transactionId: string,
        data: T,
    },
}
