import {ErrorData} from "../types/error";

export class DomainException extends Error {
    constructor(readonly errorData: ErrorData) {
        super();

        Object.setPrototypeOf(this, DomainException.prototype);
    }
}
