import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { RefreshTokenController } from "@application/controllers/auth/RefreshTokenController";

const controller = container.resolve(RefreshTokenController);

export const handler = lambdaHttpAdapter(controller);
