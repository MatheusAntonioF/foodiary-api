import { PutCommand, type PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import type { Goal } from "@application/entities/Goal";
import { GoalItem } from "../items/GoalItem";

@Injectable()
export class GoalRepository {
    constructor(private readonly appConfig: AppConfig) {}

    getPutCommandInput(goal: Goal): PutCommandInput {
        const goalItem = GoalItem.fromEntity(goal);

        return {
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Item: goalItem.toItem(),
        };
    }

    async create(goal: Goal): Promise<void> {
        await dynamoClient.send(new PutCommand(this.getPutCommandInput(goal)));
    }
}
