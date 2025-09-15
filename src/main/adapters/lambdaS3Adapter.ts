import type { IFileEventHandler } from "@application/contracts/IFileEventHandler";
import { Registry } from "@kernel/di/Registry";
import type { Constructor } from "@shared/types/Constructor";
import type { S3Handler } from "aws-lambda";

export function lambdaS3Adapter(
    eventHandlerImpl: Constructor<IFileEventHandler>
): S3Handler {
    return async (event) => {
        const eventHandler = Registry.getInstance().resolve(eventHandlerImpl);

        /**
         * we can use the promise.allSettled to receive the list of failed events
         */
        const responses = await Promise.allSettled(
            event.Records.map(async (record) => {
                await eventHandler.handle({
                    fileKey: record.s3.object.key,
                });
            })
        );

        const failedEvents = responses.filter((response) => {
            return response.status === "rejected";
        });

        for (const event of failedEvents) {
            console.error(JSON.stringify(event.reason, null, 2));
        }
    };
}
