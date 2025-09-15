import "reflect-metadata";

import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { GetMealByIdController } from "@application/controllers/meals/GetMealByIdController";

export const handler = lambdaHttpAdapter(GetMealByIdController);
