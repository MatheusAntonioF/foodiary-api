import { Controller } from "@application/contracts/Controller";
import { HelloUseCase } from "@application/useCases/HelloUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { HelloBody, schema } from "./schemas/helloSchema";

@Injectable()
@Schema(schema)
export class HelloController extends Controller<unknown> {
    constructor(private readonly helloUseCase: HelloUseCase) {
        super();
    }

    async handle(
        request: Controller.Request<HelloBody>
    ): Promise<Controller.Response<unknown>> {
        const result = await this.helloUseCase.execute({
            email: request.body.account.id,
        });

        return {
            statusCode: 200,
            body: { result },
        };
    }
}
