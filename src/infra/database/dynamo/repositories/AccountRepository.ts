import type { Account } from "@application/entities/Account";
import {
    PutCommand,
    QueryCommand,
    type PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import { AccountItem } from "../items/AccountItem";

@Injectable()
export class AccountRepository {
    constructor(private readonly appConfig: AppConfig) {}

    async findByEmail(email: string): Promise<Account | null> {
        const command = new QueryCommand({
            TableName: this.appConfig.db.dynamodb.mainTableName,
            IndexName: "GSI1",
            Limit: 1,
            KeyConditionExpression: "#GSI1PK = :GSI1PK and #GSI1SK = :GSI1SK",
            ExpressionAttributeNames: {
                "#GSI1PK": "GSI1PK",
                "#GSI1SK": "GSI1SK",
            },
            ExpressionAttributeValues: {
                ":GSI1PK": AccountItem.getGSI1PK(email),
                ":GSI1SK": AccountItem.getGSI1SK(email),
            },
        });

        const { Items = [] } = await dynamoClient.send(command);

        const account = Items[0] as AccountItem.ItemType | undefined;

        if (!account) return null;

        return AccountItem.toEntity(account);
    }

    getPutCommandInput(account: Account): PutCommandInput {
        const accountItem = AccountItem.fromEntity(account);

        return {
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Item: accountItem.toItem(),
        };
    }

    async create(account: Account): Promise<void> {
        await dynamoClient.send(
            new PutCommand(this.getPutCommandInput(account)),
        );
    }
}
