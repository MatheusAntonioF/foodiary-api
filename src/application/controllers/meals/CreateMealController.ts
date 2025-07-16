import { Controller } from "@application/contracts/Controller";
import { CreateMealUseCase } from "@application/useCases/meals/CreateMealUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
    createMealSchema,
    type CreateMealBody,
} from "./schemas/createMealSchema";
import { Meal } from "@application/entities/Meal";

@Injectable()
@Schema(createMealSchema)
export class CreateMealController extends Controller<
    "private",
    CreateMealController.Response
> {
    constructor(private readonly createMealUseCase: CreateMealUseCase) {
        super();
    }

    protected override async handle({
        accountId,
        body,
    }: Controller.Request<"private", CreateMealBody>): Promise<
        Controller.Response<CreateMealController.Response>
    > {
        const { file } = body;

        const inputType =
            file.type === "audio/m4a"
                ? Meal.InputType.AUDIO
                : Meal.InputType.PICTURE;

        const { mealId, uploadSignature } =
            await this.createMealUseCase.execute({
                accountId,
                file: { size: file.size, inputType: inputType },
            });

        return {
            statusCode: 201,
            body: { mealId, uploadSignature },
        };
    }
}

export namespace CreateMealController {
    export type Response = {
        mealId: string;
        uploadSignature: string;
    };
}
