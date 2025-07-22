import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";

import { Schema } from "@kernel/decorators/Schema";
import {
    updateGoalSchema,
    type UpdateGoalBody,
} from "./schemas/updateGoalSchema";
import { UpdateGoalUseCase } from "@application/useCases/goals/UpdateGoalUseCase";

@Injectable()
@Schema(updateGoalSchema)
export class UpdateGoalController extends Controller<
    "private",
    UpdateGoalController.Response
> {
    constructor(private readonly updateGoalUseCase: UpdateGoalUseCase) {
        super();
    }

    protected override async handle({
        accountId,
        body,
    }: Controller.Request<"private", UpdateGoalBody>): Promise<
        Controller.Response<UpdateGoalController.Response>
    > {
        const { calories, proteins, carbohydrates, fats } = body;

        await this.updateGoalUseCase.execute({
            accountId,
            calories,
            proteins,
            carbohydrates,
            fats,
        });

        return {
            statusCode: 204,
        };
    }
}

export namespace UpdateGoalController {
    export type Response = null;
}
