import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateGoalController } from "@application/controllers/goals/UpdateGoalController";

const controller = container.resolve(UpdateGoalController);

export const handler = lambdaHttpAdapter(controller);
