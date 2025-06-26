import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { CreateMealController } from "@application/controllers/meals/CreateMealController";

const controller = container.resolve(CreateMealController);

export const handler = lambdaHttpAdapter(controller);
