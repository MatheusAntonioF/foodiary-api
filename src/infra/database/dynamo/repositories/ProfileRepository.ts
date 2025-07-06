import { PutCommand, type PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "@infra/clients/dynamoClient";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";
import { ProfileItem } from "../items/ProfileItem";
import type { Profile } from "@application/entities/Profile";

@Injectable()
export class ProfileRepository {
    constructor(private readonly appConfig: AppConfig) {}

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
