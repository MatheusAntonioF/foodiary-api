import "reflect-metadata";

import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { CreateMealController } from "@application/controllers/meals/CreateMealController";

export const handler = lambdaHttpAdapter(CreateMealController);
