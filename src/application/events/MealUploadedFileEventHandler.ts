import type { IFileEventHandler } from "@application/contracts/IFileEventHandler";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class MealUploadedFileEventHandler implements IFileEventHandler {
    async handle(input: IFileEventHandler.Input): Promise<void> {
        console.log("🚀 ~ input:", input);
    }
}
