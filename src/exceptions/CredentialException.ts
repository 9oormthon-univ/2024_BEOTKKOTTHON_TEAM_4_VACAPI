export class CredentialException extends Error {
    constructor(message) {
        super(message);
        this.name = "CredentialException";
    }
}
