import type { AccountItem } from "./AccountItem";
import { Goal } from "@application/entities/Goal";

export class GoalItem {
    static readonly type = "Goal";
    private readonly keys: GoalItem.Keys;

    constructor(private readonly attr: GoalItem.Attributes) {
        this.keys = {
            PK: GoalItem.getPk(this.attr.accountId),
            SK: GoalItem.getSK(this.attr.accountId),
        };
    }

    toItem(): GoalItem.ItemType {
        return {
            ...this.keys,
            type: GoalItem.type,
            ...this.attr,
        };
    }

    static fromEntity(goal: Goal): GoalItem {
        return new GoalItem({
            ...goal,
            createdAt: goal.createdAt.toISOString(),
        });
    }

    static toEntity(goalItem: GoalItem.ItemType): Goal {
        return new Goal({
            accountId: goalItem.accountId,
            calories: goalItem.calories,
            proteins: goalItem.proteins,
            carbohydrates: goalItem.carbohydrates,
            fats: goalItem.fats,
            createdAt: new Date(goalItem.createdAt),
        });
    }

    static getPk(accountId: string): GoalItem.Keys["PK"] {
        return `ACCOUNT#${accountId}`;
    }

    static getSK(accountId: string): GoalItem.Keys["SK"] {
        return `ACCOUNT#${accountId}#GOAL`;
    }
}

export namespace GoalItem {
    export type Keys = {
        PK: AccountItem.Keys["PK"];
        SK: `ACCOUNT#${string}#GOAL`;
    };
    export type Attributes = {
        accountId: string;
        calories: number;
        proteins: number;
        carbohydrates: number;
        fats: number;
        createdAt: string;
    };

    export type ItemType = Keys & Attributes & { type: "Goal" };
}
