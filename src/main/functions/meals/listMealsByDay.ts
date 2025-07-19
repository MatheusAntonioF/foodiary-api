import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ListMealsByDayController } from "@application/controllers/meals/ListMealsByDayController";

const controller = container.resolve(ListMealsByDayController);

export const handler = lambdaHttpAdapter(controller);
