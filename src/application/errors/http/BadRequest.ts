import { ErrorCode } from "../ErrorCode";
import { HttpError } from "./HttpError";

export class BadRequest extends HttpError {
    override statusCode = 400;
    override code: ErrorCode;

    constructor(message?: any, code?: ErrorCode) {
        super();

        this.name = "BadRequest";
        this.message = message ?? "Bad Request";
        this.code = code ?? ErrorCode.BAD_REQUEST;
    }
}
