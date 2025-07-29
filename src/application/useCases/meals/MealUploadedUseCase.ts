import { Meal } from "@application/entities/Meal";
import { ResourceNotFound } from "@application/errors/application/ResourceNotFound";
import { MealRepository } from "@infra/database/dynamo/repositories/MealRepository";
import { MealsFileStorageGateway } from "@infra/gateways/MealsFileStorageGateway";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class MealUploadedUseCase {
    constructor(
        private readonly mealsRepository: MealRepository,
        private readonly mealsFileStorageGateway: MealsFileStorageGateway,
    ) {}

    async execute({
        fileKey,
    }: MealUploadedUseCase.Input): Promise<MealUploadedUseCase.Output> {
        const { accountId, mealId } =
            await this.mealsFileStorageGateway.getFileMetadata({
                fileKey,
            });

        const meal = await this.mealsRepository.findById({ mealId, accountId });

        if (!meal) {
            throw new ResourceNotFound("Meal not found.");
        }

        meal.status = Meal.Status.QUEUED;

        await this.mealsRepository.save(meal);
    }
}

export namespace MealUploadedUseCase {
    export type Input = {
        fileKey: string;
    };

    export type Output = void;
}
