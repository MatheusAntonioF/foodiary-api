import { Meal } from "@application/entities/Meal";

export class MealItem {
    static readonly type = "Meal";
    private readonly keys: MealItem.Keys;

    constructor(private readonly attr: MealItem.Attributes) {
        this.keys = {
            PK: MealItem.getPk({
                accountId: this.attr.accountId,
                mealId: this.attr.id,
            }),
            SK: MealItem.getSK({
                accountId: this.attr.accountId,
                mealId: this.attr.id,
            }),
            GSI1PK: MealItem.getGSI1PK({
                accountId: this.attr.accountId,
                createdAt: new Date(this.attr.createdAt),
            }),
            GSI1SK: MealItem.getGSI1SK(this.attr.id),
        };
    }

    toItem(): MealItem.ItemType {
        return {
            ...this.keys,
            type: MealItem.type,
            ...this.attr,
        };
    }

    static fromEntity(meal: Meal): MealItem {
        return new MealItem({
            ...meal,
            createdAt: meal.createdAt.toISOString(),
        });
    }

    static toEntity(mealItem: MealItem.ItemType): Meal {
        return new Meal({
            id: mealItem.id,
            accountId: mealItem.accountId,
            status: mealItem.status,
            attempts: mealItem.attempts,
            inputType: mealItem.inputType,
            inputFileKey: mealItem.inputFileKey,
            name: mealItem.name,
            icon: mealItem.icon,
            foods: mealItem.foods,
            createdAt: new Date(mealItem.createdAt),
        });
    }

    static getPk({
        accountId,
        mealId,
    }: MealItem.PKParams): MealItem.Keys["PK"] {
        return `ACCOUNT#${accountId}#MEAL#${mealId}`;
    }

    static getSK({
        accountId,
        mealId,
    }: MealItem.SKParams): MealItem.Keys["SK"] {
        return `ACCOUNT#${accountId}#MEAL#${mealId}`;
    }

    static getGSI1PK({
        accountId,
        createdAt,
    }: MealItem.GS1PKParams): MealItem.Keys["GSI1PK"] {
        const year = createdAt.getFullYear();
        const month = String(createdAt.getMonth() + 1).padStart(2, "0");
        const day = String(createdAt.getDate()).padStart(2, "0");

        return `MEALS#${accountId}#${year}-${month}-${day}`;
    }
    static getGSI1SK(mealId: string): MealItem.Keys["GSI1SK"] {
        return `MEAL#${mealId}`;
    }
}

export namespace MealItem {
    export type Keys = {
        PK: `ACCOUNT#${string}#MEAL#${string}`;
        SK: `ACCOUNT#${string}#MEAL#${string}`;
        GSI1PK: `MEALS#${string}#${string}-${string}-${string}`;
        GSI1SK: `MEAL#${string}`;
    };
    export type Attributes = {
        id: string;
        accountId: string;
        status: Meal.Status;
        attempts: number;
        inputType: Meal.InputType;
        inputFileKey: string;
        name: string;
        icon: string;
        foods: Meal.Food[];
        createdAt: string;
    };

    export type ItemType = Keys & Attributes & { type: "Meal" };

    export type GS1PKParams = {
        accountId: string;
        createdAt: Date;
    };

    export type PKParams = {
        accountId: string;
        mealId: string;
    };

    export type SKParams = {
        accountId: string;
        mealId: string;
    };
}
