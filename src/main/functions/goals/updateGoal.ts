import "reflect-metadata";

import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateGoalController } from "@application/controllers/goals/UpdateGoalController";

export const handler = lambdaHttpAdapter(UpdateGoalController);
