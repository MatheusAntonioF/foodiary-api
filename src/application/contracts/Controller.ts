import { getSchema } from "@kernel/decorators/Schema";
import { z } from "zod";

type TRouteType = "public" | "private";

export abstract class Controller<TType extends TRouteType, TBody = undefined> {
    protected schema?: z.ZodSchema;

    protected abstract handle(
        params: Controller.Request<TType>,
    ): Promise<Controller.Response<TBody>>;

    public execute(
        request: Controller.Request<TType>,
    ): Promise<Controller.Response<TBody>> {
        const body = this.validateBody(request.body);

        return this.handle({ ...request, body });
    }

    private validateBody(body: Controller.Request<TType>["body"]) {
        const schema = getSchema(this);

        if (!schema) return body;

        return schema.parse(body);
    }
}

export namespace Controller {
    type BaseRequest<
        TBody = Record<string, unknown>,
        TParams = Record<string, unknown>,
        TQueryParams = Record<string, unknown>,
    > = {
        body: TBody;
        params: TParams;
        queryParams: TQueryParams;
    };

    type PublicRequest<
        TBody = Record<string, unknown>,
        TParams = Record<string, unknown>,
        TQueryParams = Record<string, unknown>,
    > = BaseRequest<TBody, TParams, TQueryParams> & {
        accountId: null;
    };

    type PrivateRequest<
        TBody = Record<string, unknown>,
        TParams = Record<string, unknown>,
        TQueryParams = Record<string, unknown>,
    > = BaseRequest<TBody, TParams, TQueryParams> & {
        accountId: string;
    };

    export type Request<
        TType extends TRouteType,
        TBody = Record<string, unknown>,
        TParams = Record<string, unknown>,
        TQueryParams = Record<string, unknown>,
    > = TType extends "public"
        ? PublicRequest<TBody, TParams, TQueryParams>
        : PrivateRequest<TBody, TParams, TQueryParams>;

    export type Response<TBody = undefined> = {
        statusCode: number;
        body?: TBody;
    };
}
