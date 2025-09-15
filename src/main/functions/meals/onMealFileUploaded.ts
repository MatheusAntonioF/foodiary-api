import "reflect-metadata";

import { lambdaS3Adapter } from "@main/adapters/lambdaS3Adapter";
import { MealUploadedFileEventHandler } from "@application/events/files/MealUploadedFileEventHandler";

export const handler = lambdaS3Adapter(MealUploadedFileEventHandler);
