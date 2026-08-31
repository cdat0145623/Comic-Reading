import { CredentialsSignin } from "next-auth";
export class AppError extends Error {
    constructor(message, status = 500, meta = {}) {
        super(message);
        this.name = "AppError";
        this.status = status;
        this.meta = meta;
    }
}

export class CustomError extends CredentialsSignin {
    constructor(code) {
        super();
        this.name = "CustomError";
        this.code = code;
    }
}
