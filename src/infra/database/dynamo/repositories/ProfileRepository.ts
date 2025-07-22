import {
    GetCommand,
    PutCommand,
    UpdateCommand,
    type PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import { ProfileItem } from "../items/ProfileItem";
import type { Profile } from "@application/entities/Profile";

@Injectable()
export class ProfileRepository {
    constructor(private readonly appConfig: AppConfig) {}

    async findByAccountId(accountId: string): Promise<Profile | null> {
        const command = new GetCommand({
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Key: {
                PK: ProfileItem.getPk(accountId),
                SK: ProfileItem.getSK(accountId),
            },
        });

        const { Item: profileItem } = await dynamoClient.send(command);

        if (!profileItem) return null;

        return ProfileItem.toEntity(profileItem as ProfileItem.ItemType);
    }

    async save(profile: Profile) {
        const profileItem = ProfileItem.fromEntity(profile).toItem();

        const command = new UpdateCommand({
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Key: {
                PK: profileItem.PK,
                SK: profileItem.SK,
            },
            UpdateExpression: `
                SET
                #name = :name,
                #gender = :gender,
                #birthDate = :birthDate,
                #height = :height,
                #weight = :weight
            `,
            ExpressionAttributeNames: {
                "#name": "name",
                "#gender": "gender",
                "#birthDate": "birthDate",
                "#height": "height",
                "#weight": "weight",
            },
            ExpressionAttributeValues: {
                ":name": profileItem.name,
                ":gender": profileItem.gender,
                ":birthDate": profileItem.birthDate,
                ":height": profileItem.height,
                ":weight": profileItem.weight,
            },
            ReturnValues: "NONE",
        });

        await dynamoClient.send(command);
    }

    getPutCommandInput(profile: Profile): PutCommandInput {
        const profileItem = ProfileItem.fromEntity(profile);

        return {
            TableName: this.appConfig.db.dynamodb.mainTableName,
            Item: profileItem.toItem(),
        };
    }

    async create(profile: Profile): Promise<void> {
        await dynamoClient.send(
            new PutCommand(this.getPutCommandInput(profile)),
        );
    }
}
