import type { IQueueConsumer } from "@application/contracts/IQueueConsumer";
import type { SQSHandler } from "aws-lambda";

export function lambdaSQSAdapter(consumer: IQueueConsumer<any>): SQSHandler {
    return async (event) => {
        await Promise.all(
            event.Records.map(async (record) => {
                const message = JSON.parse(record.body);

                await consumer.process(message);
            }),
        );
    };
}
