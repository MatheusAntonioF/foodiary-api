import { PutCommand, type PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import type { Meal } from "@application/entities/Meal";
import { MealItem } from "../items/MealItem";

@Injectable()
export class MealRepository {
    constructor(private readonly appConfig: AppConfig) {}

    getPutCommandInput(meal: Meal): PutCommandInput {
        const mealItem = MealItem.fromEntity(meal);

        return {
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Item: mealItem.toItem(),
        };
    }

    async create(meal: Meal): Promise<void> {
        await dynamoClient.send(new PutCommand(this.getPutCommandInput(meal)));
    }
}
