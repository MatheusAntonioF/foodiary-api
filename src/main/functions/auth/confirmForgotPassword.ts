import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { ConfirmForgotPasswordController } from "@application/controllers/auth/ConfirmForgotPasswordController";

const controller = container.resolve(ConfirmForgotPasswordController);

export const handler = lambdaHttpAdapter(controller);
