import type { z } from "zod";

const SCHEMA_METADATA_KEY = "custom:schema";

export function Schema(schema: z.ZodSchema): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(SCHEMA_METADATA_KEY, schema, target);
    };
}

export function getSchema(target: any): z.ZodSchema | undefined {
    /**
     * we need to specify the target.constructor instead of just target
     * cause we need to use the getSchema into the instance of the class not in the definition
     *
     * if the method is static we could use just target, but that's not the case
     */
    return Reflect.getMetadata(SCHEMA_METADATA_KEY, target.constructor);
}
