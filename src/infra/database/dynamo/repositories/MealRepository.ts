import {
    GetCommand,
    PutCommand,
    UpdateCommand,
    type PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import type { Meal } from "@application/entities/Meal";
import { MealItem } from "../items/MealItem";

@Injectable()
export class MealRepository {
    constructor(private readonly appConfig: AppConfig) {}

    async findById({
        mealId,
        accountId,
    }: MealRepository.FindByIdParams): Promise<Meal | null> {
        const command = new GetCommand({
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Key: {
                PK: MealItem.getPk({ mealId, accountId }),
                SK: MealItem.getSK({ mealId, accountId }),
            },
        });

        const { Item: mealItem } = await dynamoClient.send(command);

        if (!mealItem) return null;

        return MealItem.toEntity(mealItem as MealItem.ItemType);
    }

    async save(meal: Meal) {
        const mealItem = MealItem.fromEntity(meal).toItem();

        const command = new UpdateCommand({
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Key: {
                PK: mealItem.PK,
                SK: mealItem.SK,
            },
            UpdateExpression: `
                    SET
                    #status = :status,
                    #attempts = :attempts,
                    #name = :name,
                    #icon = :icon,
                    #foods = :foods
                `,
            ExpressionAttributeNames: {
                "#status": "status",
                "#attempts": "attempts",
                "#name": "name",
                "#icon": "icon",
                "#foods": "foods",
            },
            ExpressionAttributeValues: {
                ":status": mealItem.status,
                ":attempts": mealItem.attempts,
                ":name": mealItem.name,
                ":icon": mealItem.icon,
                ":foods": mealItem.foods,
            },
            ReturnValues: "NONE",
        });

        await dynamoClient.send(command);
    }

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

export namespace MealRepository {
    export type FindByIdParams = {
        mealId: string;
        accountId: string;
    };
}
