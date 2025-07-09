import type { AccountItem } from "./AccountItem";
import { Profile } from "@application/entities/Profile";

export class ProfileItem {
    private readonly type = "Profile";
    private readonly keys: ProfileItem.Keys;

    constructor(private readonly attr: ProfileItem.Attributes) {
        this.keys = {
            PK: ProfileItem.getPk(this.attr.accountId),
            SK: ProfileItem.getSK(this.attr.accountId),
        };
    }

    toItem(): ProfileItem.ItemType {
        return {
            ...this.keys,
            type: this.type,
            ...this.attr,
        };
    }

    static fromEntity(profile: Profile): ProfileItem {
        return new ProfileItem({
            ...profile,
            birthDate: profile.birthDate.toISOString(),
            createdAt: profile.createdAt.toISOString(),
        });
    }

    static toEntity(profileItem: ProfileItem.ItemType): Profile {
        return new Profile({
            accountId: profileItem.accountId,
            activityLevel: profileItem.activityLevel,
            birthDate: new Date(profileItem.birthDate),
            gender: profileItem.gender,
            height: profileItem.height,
            name: profileItem.name,
            weight: profileItem.weight,
            goal: profileItem.goal,
            createdAt: new Date(profileItem.createdAt),
        });
    }

    static getPk(accountId: string): ProfileItem.Keys["PK"] {
        return `ACCOUNT#${accountId}`;
    }

    static getSK(accountId: string): ProfileItem.Keys["SK"] {
        return `ACCOUNT#${accountId}#PROFILE`;
    }
}

export namespace ProfileItem {
    export type Keys = {
        PK: AccountItem.Keys["PK"];
        SK: `ACCOUNT#${string}#PROFILE`;
    };
    export type Attributes = {
        accountId: string;
        name: string;
        birthDate: string;
        gender: Profile.Gender;
        height: number;
        weight: number;
        activityLevel: Profile.ActivityLevel;
        createdAt: string;
        goal: Profile.Goal;
    };

    export type ItemType = Keys & Attributes & { type: "Profile" };
}
