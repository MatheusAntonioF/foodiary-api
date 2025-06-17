import { Injectable } from "@kernel/decorators/Injectable";
import { env } from "./env";

@Injectable()
export class AppConfig {
    public readonly auth: AppConfig.Auth;
    public readonly db: AppConfig.Database;

    constructor() {
        this.auth = {
            cognito: {
                clientId: env.COGNITO_CLIENT_ID,
                clientSecret: env.COGNITO_CLIENT_SECRET,
            },
        };

        this.db = {
            dynamodb: {
                mainTableName: env.MAIN_TABLE_NAME,
            },
        };
    }
}

export namespace AppConfig {
    export type Auth = {
        cognito: {
            clientId: string;
            clientSecret: string;
        };
    };

    export type Database = {
        dynamodb: {
            mainTableName: string;
        };
    };
}
