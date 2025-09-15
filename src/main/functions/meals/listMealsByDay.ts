import "reflect-metadata";

import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ListMealsByDayController } from "@application/controllers/meals/ListMealsByDayController";

export const handler = lambdaHttpAdapter(ListMealsByDayController);
