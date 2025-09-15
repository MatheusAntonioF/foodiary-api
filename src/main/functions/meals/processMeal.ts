import "reflect-metadata";

import { MealsQueueConsumer } from "@application/queues/MealsQueueConsumer";
import { lambdaSQSAdapter } from "@main/adapters/lambdaSqsAdapter";

export const handler = lambdaSQSAdapter(MealsQueueConsumer);
