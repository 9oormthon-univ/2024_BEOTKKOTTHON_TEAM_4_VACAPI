import {BaseResponse} from "./response";

export class ErrorResponse extends BaseResponse<any> {
    code!: string;

    constructor(message: string, code: string, field?: string[]) {
        super(false, message, field);
        this.code = code;
    }
}
