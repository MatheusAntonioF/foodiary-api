import { Injectable } from "@kernel/decorators/Injectable";
import { env } from "./env";

@Injectable()
export class AppConfig {
    public readonly auth: AppConfig.Auth;
    public readonly db: AppConfig.Database;
    public readonly storage: AppConfig.Storage;
    public readonly cdns: AppConfig.CDNs;
    public readonly queues: AppConfig.Queues;

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

        this.cdns = {
            mealsCDN: env.MEALS_CDN_DOMAIN_NAME,
        };

        this.queues = {
            mealsQueueUrl: env.MEALS_QUEUE_URL,
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

    export type CDNs = {
        mealsCDN: string;
    };

    export type Queues = {
        mealsQueueUrl: string;
    };
}
