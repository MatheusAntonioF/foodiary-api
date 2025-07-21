import type { Meal } from "@application/entities/Meal";
import { ResourceNotFound } from "@application/errors/application/ResourceNotFound";
import { MealRepository } from "@infra/database/dynamo/repositories/MealRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetMealByIdUseCase {
    constructor(private readonly mealRepository: MealRepository) {}

    async execute({
        accountId,
        mealId,
    }: GetMealByIdUseCase.Input): Promise<GetMealByIdUseCase.Output> {
        const meal = await this.mealRepository.findById({ accountId, mealId });

        if (!meal) {
            throw new ResourceNotFound("Meal not found.");
        }

        return {
            meal: {
                id: meal.id,
                status: meal.status,
                inputType: meal.inputType,
                inputFileKey: meal.inputFileKey,
                name: meal.name,
                icon: meal.icon,
                foods: meal.foods,
                createdAt: meal.createdAt,
            },
        };
    }
}

export namespace GetMealByIdUseCase {
    export type Input = {
        accountId: string;
        mealId: string;
    };

    export type Output = {
        meal: {
            id: string;
            status: Meal.Status;
            inputType: Meal.InputType;
            inputFileKey: string;
            name: string;
            icon: string;
            foods: Meal.Food[];
            createdAt: Date;
        };
    };
}
