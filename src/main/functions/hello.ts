import "reflect-metadata";

import { HelloController } from "@application/controllers/HelloController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

const controller = new HelloController();

export const handler = lambdaHttpAdapter(controller);
