import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ForgotPasswordController } from "@application/controllers/auth/ForgotPasswordController";

const controller = container.resolve(ForgotPasswordController);

export const handler = lambdaHttpAdapter(controller);
