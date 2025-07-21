import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { GetMealByIdController } from "@application/controllers/meals/GetMealByIdController";

const controller = container.resolve(GetMealByIdController);

export const handler = lambdaHttpAdapter(controller);
