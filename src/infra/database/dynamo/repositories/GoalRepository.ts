import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import type { Goal } from "@application/entities/Goal";
import { GoalItem } from "../items/GoalItem";

@Injectable()
export class GoalRepository {
    constructor(private readonly appConfig: AppConfig) {}

    async create(goal: Goal): Promise<void> {
        const goalItem = GoalItem.fromEntity(goal);

        const command = new PutCommand({
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Item: goalItem.toItem(),
        });

        await dynamoClient.send(command);
    }
}
