import { Injectable } from "@kernel/decorators/Injectable";
import { env } from "./env";

@Injectable()
export class AppConfig {
    public readonly auth: AppConfig.Auth;
    public readonly db: AppConfig.Database;
    public readonly storage: AppConfig.Storage;

    constructor() {
        this.auth = {
            cognito: {
                clientId: env.COGNITO_CLIENT_ID,
                clientSecret: env.COGNITO_CLIENT_SECRET,
                userPoolId: env.COGNITO_POOL_ID,
            },
        };

        this.db = {
            dynamodb: {
                mainTableName: env.MAIN_TABLE_NAME,
            },
        };

        this.storage = {
            mealsBucket: env.MEALS_BUCKET_NAME,
        };
    }
}

export namespace AppConfig {
    export type Auth = {
        cognito: {
            clientId: string;
            clientSecret: string;
            userPoolId: string;
        };
    };

    export type Database = {
        dynamodb: {
            mainTableName: string;
        };
    };

    export type Storage = {
        mealsBucket: string;
    };
}
