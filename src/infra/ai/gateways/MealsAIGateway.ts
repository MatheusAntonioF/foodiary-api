import { Meal } from "@application/entities/Meal";
import { Injectable } from "@kernel/decorators/Injectable";
import OpenAI from "openai";
import { MealsFileStorageGateway } from "../../gateways/MealsFileStorageGateway";

@Injectable()
export class MealsAIGateway {
    private readonly client = new OpenAI();

    constructor(
        private readonly mealsFileStorageGateway: MealsFileStorageGateway,
    ) {}

    async processMeal(meal: Meal): Promise<MealsAIGateway.ProcessMealResult> {
        if (meal.inputType === Meal.InputType.PICTURE) {
            const imageURL = this.mealsFileStorageGateway.getFileURL(
                meal.inputFileKey,
            );

            const response = await this.client.chat.completions.create({
                model: "gpt-4.1-mini",
                messages: [
                    {
                        role: "system",
                        content: "",
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageURL,
                                    detail: "high",
                                },
                            },
                            {
                                type: "text",
                                text: "O que é essa imagem?",
                            },
                        ],
                    },
                ],
            });

            console.log("🚀 ~ response:", JSON.stringify(response, null, 2));
        }

        return { name: "", icon: "", foods: [] };
    }
}

export namespace MealsAIGateway {
    export type ProcessMealResult = {
        name: string;
        icon: string;
        foods: Meal.Food[];
    };
}
