import { Controller } from "@application/contracts/Controller";
import { Schema } from "@kernel/decorators/Schema";
import { HelloBody, schema } from "./schemas/helloSchema";

@Schema(schema)
export class HelloController extends Controller<unknown> {
    protected override schema = schema;

    async handle(
        request: Controller.Request<HelloBody>
    ): Promise<Controller.Response<unknown>> {
        return {
            statusCode: 200,
            body: { request },
        };
    }
}
