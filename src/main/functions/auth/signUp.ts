import "reflect-metadata";

import { SignUpController } from "@application/controllers/auth/SignUpController";
import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

const controller = container.resolve(SignUpController);

export const handler = lambdaHttpAdapter(controller);
