import {
    TransactWriteCommand,
    type PutCommandInput,
    type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";

export abstract class UnitOfWork {
    private transactItems: NonNullable<
        TransactWriteCommandInput["TransactItems"]
    > = [];

    protected addPut(putInput: PutCommandInput) {
        this.transactItems.push({
            Put: putInput,
        });
    }

    protected async commit() {
        const command = new TransactWriteCommand({
            TransactItems: this.transactItems,
        });

        await dynamoClient.send(command);
    }
}
