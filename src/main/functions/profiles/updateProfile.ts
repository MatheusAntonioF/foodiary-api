import "reflect-metadata";

import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";
import { UpdateProfileController } from "@application/controllers/profiles/UpdateProfileController";

export const handler = lambdaHttpAdapter(UpdateProfileController);
