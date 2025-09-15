import type { SQSHandler } from "aws-lambda";
import type { IQueueConsumer } from "@application/contracts/IQueueConsumer";
import type { Constructor } from "@shared/types/Constructor";
import { Registry } from "@kernel/di/Registry";

export function lambdaSQSAdapter(
    consumerImpl: Constructor<IQueueConsumer<any>>
): SQSHandler {
    return async (event) => {
        const queueConsumer = Registry.getInstance().resolve(consumerImpl);

        await Promise.all(
            event.Records.map(async (record) => {
                const message = JSON.parse(record.body);

                await queueConsumer.process(message);
            })
        );
    };
}
