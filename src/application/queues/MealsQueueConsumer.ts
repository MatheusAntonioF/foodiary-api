import type { IQueueConsumer } from "@application/contracts/IQueueConsumer";
import type { MealsQueueGateway } from "@infra/gateways/MealsQueueGateway";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class MealsQueueConsumer
    implements IQueueConsumer<MealsQueueGateway.Message>
{
    async process({
        accountId,
        mealId,
    }: MealsQueueGateway.Message): Promise<void> {}
}
