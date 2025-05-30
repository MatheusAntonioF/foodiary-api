import type { z } from "zod";

const SCHEMA_METADATA_KEY = "custom:schema";

export function Schema(schema: z.ZodSchema): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(SCHEMA_METADATA_KEY, schema, target);
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSchema(target: any): z.ZodSchema | undefined {
    return Reflect.getMetadata(SCHEMA_METADATA_KEY, target.constructor);
}
