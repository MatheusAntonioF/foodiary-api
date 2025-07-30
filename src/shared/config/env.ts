import { z } from "zod";

export const envSchema = z.object({
    COGNITO_CLIENT_ID: z.string().min(1),
    COGNITO_CLIENT_SECRET: z.string().min(1),
    MAIN_TABLE_NAME: z.string().min(1),
    COGNITO_POOL_ID: z.string().min(1),
    MEALS_BUCKET_NAME: z.string().min(1),

    MEALS_CDN_DOMAIN_NAME: z.string().min(1),
    MEALS_QUEUE_URL: z.string().min(1),
});

function getEnv() {
    try {
        return envSchema.parse(process.env);
    } catch {
        throw new Error("Cannot validate environment variables.");
    }
}

export const env = getEnv();
