import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionContentPart } from "openai/resources/index";

import { Meal } from "@application/entities/Meal";
import { Injectable } from "@kernel/decorators/Injectable";
import { downloadFileFromURL } from "@utils/downloadFileFromURL";

import { getTextPrompt } from "../prompts/getTextPrompt";
import { getImagePrompt } from "../prompts/getImagePrompt";
import { MealsFileStorageGateway } from "../../gateways/MealsFileStorageGateway";

const mealSchema = z.object({
    name: z.string(),
    icon: z.string(),
    foods: z.array(
        z.object({
            name: z.string(),
            quantity: z.string(),
            calories: z.number(),
            carbohydrates: z.number(),
            fats: z.number(),
            proteins: z.number(),
        })
    ),
});

@Injectable()
export class MealsAIGateway {
    private readonly client = new OpenAI();

    constructor(
        private readonly mealsFileStorageGateway: MealsFileStorageGateway
    ) {}

    async processMeal(meal: Meal): Promise<MealsAIGateway.ProcessMealResult> {
        const mealFileUrl = this.mealsFileStorageGateway.getFileURL(
            meal.inputFileKey
        );

        if (meal.inputType === Meal.InputType.PICTURE) {
            return this.callAI({
                mealId: meal.id,
                systemPrompt: getImagePrompt(),
                userMessageParts: [
                    {
                        type: "image_url",
                        image_url: {
                            url: mealFileUrl,
                            detail: "high",
                        },
                    },
                    {
                        type: "text",
                        text: `Meal Date: ${meal.createdAt}`,
                    },
                ],
            });
        }

        const transcription = await this.transcribe(mealFileUrl);

        return this.callAI({
            mealId: meal.id,
            systemPrompt: getTextPrompt(),
            userMessageParts: `
                Meal Date: ${meal.createdAt}
                Meal: ${transcription}
            `,
        });
    }

    private async transcribe(audioFileUrl: string) {
        const audioFile = await downloadFileFromURL(audioFileUrl);

        const { text } = await this.client.audio.transcriptions.create({
            model: "gpt-4o-mini-transcribe",
            file: await toFile(audioFile, "audio.m4a", { type: "audio/m4a" }),
        });

        return text;
    }

    private async callAI({
        mealId,
        systemPrompt,
        userMessageParts: userMessages,
    }: MealsAIGateway.CallAIParams): Promise<MealsAIGateway.ProcessMealResult> {
        const response = await this.client.chat.completions.create({
            model: "gpt-4.1-mini",
            response_format: zodResponseFormat(mealSchema, "meal"),
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: userMessages,
                },
            ],
        });

        const json = response.choices[0].message.content;

        if (!json) {
            console.error("OpenAI response:", JSON.stringify(json, null, 2));
            throw new Error(`Failed to process meal: ${mealId}`);
        }

        const { success, data, error } = mealSchema.safeParse(JSON.parse(json));

        if (!success) {
            console.error("Zod Error:", JSON.stringify(error.issues, null, 2));
            console.error("OpenAI response:", JSON.stringify(json, null, 2));
            throw new Error(`Failed to process meal: ${mealId}`);
        }

        return data;
    }
}

export namespace MealsAIGateway {
    export type ProcessMealResult = {
        name: string;
        icon: string;
        foods: Meal.Food[];
    };

    export type CallAIParams = {
        mealId: string;
        systemPrompt: string;
        userMessageParts: string | ChatCompletionContentPart[];
    };
}
