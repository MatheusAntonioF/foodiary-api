import { z } from "zod";

export const envSchema = z.object({
    COGNITO_CLIENT_ID: z.string().min(1),
});

function getEnv() {
    try {
        return envSchema.parse(process.env);
    } catch {
        throw new Error("Cannot validate environment variables.");
    }
}

export const env = getEnv();
