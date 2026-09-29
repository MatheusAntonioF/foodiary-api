import "reflect-metadata";

import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateMealController } from "@application/controllers/meals/UpdateMealController";

export const handler = lambdaHttpAdapter(UpdateMealController);
