import { Meal } from "@application/entities/Meal";
import { ResourceNotFound } from "@application/errors/application/ResourceNotFound";
import { BadRequest } from "@application/errors/http/BadRequest";
import { MealRepository } from "@infra/database/dynamo/repositories/MealRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateMealUseCase {
    constructor(private readonly mealRepository: MealRepository) {}

    async execute({
        accountId,
        mealId,
        name,
        foods,
    }: UpdateMealUseCase.Input): Promise<UpdateMealUseCase.Output> {
        const meal = await this.mealRepository.findById({ accountId, mealId });

        if (!meal) {
            throw new ResourceNotFound("Meal not found.");
        }

        if (meal.status !== Meal.Status.SUCCESS) {
            throw new BadRequest("Only processed meals can be updated.");
        }

        meal.name = name;
        meal.foods = foods;

        await this.mealRepository.save(meal);
    }
}

export namespace UpdateMealUseCase {
    export type Input = {
        accountId: string;
        mealId: string;

        name: string;
        foods: Meal.Food[];
    };

    export type Output = void;
}
