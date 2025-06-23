import type { Account } from "@application/entities/Account";

export class AccountItem {
    private readonly type = "Account";
    private readonly keys: AccountItem.Keys;

    constructor(private readonly attr: AccountItem.Attributes) {
        this.keys = {
            PK: AccountItem.getPk(this.attr.id),
            SK: AccountItem.getSK(this.attr.id),
            GSI1PK: AccountItem.getGSI1PK(this.attr.email),
            GSI1SK: AccountItem.getGSI1SK(this.attr.email),
        };
    }

    toItem(): AccountItem.ItemType {
        return {
            ...this.keys,
            type: this.type,
            ...this.attr,
        };
    }

    static fromEntity(account: Account): AccountItem {
        return new AccountItem({
            ...account,
            createdAt: account.createdAt.toISOString(),
        });
    }

    static getPk(accountId: string): AccountItem.Keys["PK"] {
        return `ACCOUNT#${accountId}`;
    }

    static getSK(accountId: string): AccountItem.Keys["SK"] {
        return `ACCOUNT#${accountId}`;
    }

    static getGSI1PK(email: string): AccountItem.Keys["GSI1PK"] {
        return `ACCOUNT#${email}`;
    }
    static getGSI1SK(email: string): AccountItem.Keys["GSI1SK"] {
        return `ACCOUNT#${email}`;
    }
}

export namespace AccountItem {
    export type Keys = {
        PK: `ACCOUNT#${string}`;
        SK: `ACCOUNT#${string}`;
        GSI1PK: `ACCOUNT#${string}`;
        GSI1SK: `ACCOUNT#${string}`;
    };
    export type Attributes = {
        id: string;
        email: string;
        externalId: string;
        createdAt: string;
    };

    export type ItemType = Keys & Attributes & { type: string };
}
