import { getSchema } from "@kernel/decorators/Schema";
import { z } from "zod";

export abstract class Controller<TBody = undefined> {
    protected schema?: z.ZodSchema;

    protected abstract handle(
        params: Controller.Request
    ): Promise<Controller.Response<TBody>>;

    public execute(
        request: Controller.Request
    ): Promise<Controller.Response<TBody>> {
        const body = this.validateBody(request.body);

        return this.handle({ ...request, body });
    }

    private validateBody(body: Controller.Request["body"]) {
        const schema = getSchema(this);

        if (!schema) return body;

        return schema.parse(body);
    }
}

export namespace Controller {
    export type Request<
        TBody = Record<string, unknown>,
        TParams = Record<string, unknown>,
        TQueryParams = Record<string, unknown>
    > = {
        body: TBody;
        params: TParams;
        queryParams: TQueryParams;
    };

    export type Response<TBody = undefined> = {
        statusCode: number;
        body?: TBody;
    };
}
