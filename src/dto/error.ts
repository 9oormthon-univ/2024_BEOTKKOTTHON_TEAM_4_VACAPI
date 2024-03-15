export class ErrorResponse {
    message: string;
    code: string;
    data?: any;

    constructor(message: string, code: string, data?: any) {
        this.message = message;
        this.code = code;
        this.data = data;
    }
}
