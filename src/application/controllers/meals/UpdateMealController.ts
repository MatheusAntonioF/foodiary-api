import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";

import { Schema } from "@kernel/decorators/Schema";
import {
    updateMealSchema,
    type UpdateMealBody,
} from "./schemas/updateMealSchema";
import { UpdateMealUseCase } from "@application/useCases/meals/UpdateMealUseCase";

@Injectable()
@Schema(updateMealSchema)
export class UpdateMealController extends Controller<
    "private",
    UpdateMealController.Response
> {
    constructor(private readonly updateMealUseCase: UpdateMealUseCase) {
        super();
    }

    protected override async handle({
        accountId,
        params,
        body,
    }: UpdateMealController.Request): Promise<
        Controller.Response<UpdateMealController.Response>
    > {
        const { name, foods } = body;

        await this.updateMealUseCase.execute({
            accountId,
            mealId: params.mealId,
            name,
            foods,
        });

        return {
            statusCode: 204,
        };
    }
}

export namespace UpdateMealController {
    export type Params = {
        mealId: string;
    };

    export type Request = Controller.Request<"private", UpdateMealBody, Params>;

    export type Response = null;
}
