import { Meal } from "@application/entities/Meal";
import { MealRepository } from "@infra/database/dynamo/repositories/MealRepository";
import { MealsFileStorageGateway } from "@infra/gateways/MealsFileStorageGateway";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateMealUseCase {
    constructor(
        private readonly mealRepository: MealRepository,
        private readonly mealsFileStorageGateway: MealsFileStorageGateway,
    ) {}

    async execute({
        accountId,
        file,
    }: CreateMealUseCase.Input): Promise<CreateMealUseCase.Output> {
        const inputFileKey = MealsFileStorageGateway.generateInputFileKey({
            accountId,
            inputType: file.inputType,
        });

        const meal = new Meal({
            accountId,
            inputType: file.inputType,
            inputFileKey,
            status: Meal.Status.UPLOADING,
        });

        const [, { uploadSignature }] = await Promise.all([
            await this.mealRepository.create(meal),
            await this.mealsFileStorageGateway.createPOST({
                mealId: meal.id,
                file: {
                    fileKey: inputFileKey,
                    fileSize: file.size,
                    inputType: file.inputType,
                },
            }),
        ]);

        return {
            mealId: meal.id,
            uploadSignature,
        };
    }
}

export namespace CreateMealUseCase {
    export type Input = {
        accountId: string;
        file: {
            inputType: Meal.InputType;
            size: number;
        };
    };

    export type Output = { mealId: string; uploadSignature: string };
}
