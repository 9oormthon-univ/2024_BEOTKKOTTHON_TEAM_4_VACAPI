export class CodefResponse<T> {
    result!: {
        code: string;
        extraMessage: string;
        message: string;
        transactionId: string;
    };
    data!: T;
}
