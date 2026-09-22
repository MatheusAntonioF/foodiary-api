import { Meal } from "@application/entities/Meal";
import { mbToBytes } from "@shared/utils/mbToBytes";
import { z } from "zod";

export const createMealSchema = z.object({
    file: z.object({
        type: z.enum(Meal.inputFileContentTypes),
        size: z
            .number()
            .min(1, "The file should have at least 1 byte.")
            .max(mbToBytes(10), "The file should have to 10MB."),
    }),
});

export type CreateMealBody = z.infer<typeof createMealSchema>;
