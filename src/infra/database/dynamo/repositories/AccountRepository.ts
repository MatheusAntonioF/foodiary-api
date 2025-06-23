import type { Account } from "@application/entities/Account";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import { AccountItem } from "../items/AccountItem";

@Injectable()
export class AccountRepository {
    constructor(private readonly appConfig: AppConfig) {}
    async create(account: Account): Promise<void> {
        const accountItem = AccountItem.fromEntity(account);

        const command = new PutCommand({
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Item: {},
        });

        await dynamoClient.send(command);
    }
}
