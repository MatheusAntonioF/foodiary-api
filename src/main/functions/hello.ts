import "reflect-metadata";

import { HelloController } from "@application/controllers/HelloController";
import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

const controller = container.resolve(HelloController);

export const handler = lambdaHttpAdapter(controller);
