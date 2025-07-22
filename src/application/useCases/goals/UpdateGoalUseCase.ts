import { ResourceNotFound } from "@application/errors/application/ResourceNotFound";
import { GoalRepository } from "@infra/database/dynamo/repositories/GoalRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateGoalUseCase {
    constructor(private readonly goalsRepository: GoalRepository) {}

    async execute({
        accountId,
        calories,
        proteins,
        carbohydrates,
        fats,
    }: UpdateGoalUseCase.Input): Promise<UpdateGoalUseCase.Output> {
        const goal = await this.goalsRepository.findByAccountId(accountId);

        if (!goal) {
            throw new ResourceNotFound("Goal not found.");
        }

        goal.calories = calories;
        goal.proteins = proteins;
        goal.carbohydrates = carbohydrates;
        goal.fats = fats;

        await this.goalsRepository.save(goal);
    }
}

export namespace UpdateGoalUseCase {
    export type Input = {
        accountId: string;

        calories: number;
        proteins: number;
        carbohydrates: number;
        fats: number;
    };

    export type Output = void;
}
