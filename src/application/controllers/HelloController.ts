import type { IHttpRequest } from "../contracts/HttpRequest";

export class HelloController {
    async handle(request: IHttpRequest) {
        return {
            statusCode: 200,
            body: "Hello from Lambda!",
        };
    }
}
