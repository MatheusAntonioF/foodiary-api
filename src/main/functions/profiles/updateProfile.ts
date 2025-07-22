import "reflect-metadata";

import { container } from "@kernel/di/container";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateProfileController } from "@application/controllers/profiles/UpdateProfileController";

const controller = container.resolve(UpdateProfileController);

export const handler = lambdaHttpAdapter(controller);
