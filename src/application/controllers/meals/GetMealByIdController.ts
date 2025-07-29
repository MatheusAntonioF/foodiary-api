import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";

import { Meal } from "@application/entities/Meal";
import { GetMealByIdUseCase } from "@application/useCases/meals/GetMealByIdUseCase";

@Injectable()
export class GetMealByIdController extends Controller<
    "private",
    GetMealByIdController.Response
> {
    constructor(private readonly getMealByIdUseCase: GetMealByIdUseCase) {
        super();
    }

    protected override async handle({
        accountId,
        params,
    }: GetMealByIdController.Request): Promise<
        Controller.Response<GetMealByIdController.Response>
    > {
        const { meal } = await this.getMealByIdUseCase.execute({
            accountId,
            mealId: params.mealId,
        });

        return {
            statusCode: 200,
            body: { meal },
        };
    }
}

export namespace GetMealByIdController {
    export type Params = {
        mealId: string;
    };

    export type Request = Controller.Request<
        "private",
        Record<string, unknown>,
        Params
    >;

    export type Response = {
        meal: {
            id: string;
            status: Meal.Status;
            inputType: Meal.InputType;
            inputFileURL: string;
            name: string;
            icon: string;
            foods: Meal.Food[];
            createdAt: Date;
        };
    };
}
