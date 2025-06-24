import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { SignInController } from "@application/controllers/auth/SignInController";

const controller = container.resolve(SignInController);

export const handler = lambdaHttpAdapter(controller);
