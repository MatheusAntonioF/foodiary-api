import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { GetMeController } from "@application/controllers/account/GetMeController";

const controller = container.resolve(GetMeController);

export const handler = lambdaHttpAdapter(controller);
