import { z } from "zod";

const foodSchema = z.object({
    name: z.string().trim().min(1, "The food name is required."),
    quantity: z.string().trim().min(1, "The food quantity is required."),
    calories: z.number().min(0),
    proteins: z.number().min(0),
    carbohydrates: z.number().min(0),
    fats: z.number().min(0),
});

export const updateMealSchema = z.object({
    name: z.string().trim().min(1, "The meal name is required."),
    foods: z.array(foodSchema),
});

export type UpdateMealBody = z.infer<typeof updateMealSchema>;
