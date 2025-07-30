import { Meal } from "@application/entities/Meal";
import { ResourceNotFound } from "@application/errors/application/ResourceNotFound";
import { MealRepository } from "@infra/database/dynamo/repositories/MealRepository";
import { MealsFileStorageGateway } from "@infra/gateways/MealsFileStorageGateway";
import { MealsQueueGateway } from "@infra/gateways/MealsQueueGateway";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class MealUploadedUseCase {
    constructor(
        private readonly mealsRepository: MealRepository,
        private readonly mealsFileStorageGateway: MealsFileStorageGateway,
        private readonly mealsQueueGateway: MealsQueueGateway,
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

        await this.mealsQueueGateway.publish({ accountId, mealId });
    }
}

export namespace MealUploadedUseCase {
    export type Input = {
        fileKey: string;
    };

    export type Output = void;
}
