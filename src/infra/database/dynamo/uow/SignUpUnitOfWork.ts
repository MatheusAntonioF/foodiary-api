import type { Account } from "@application/entities/Account";
import { UnitOfWork } from "./UnitOfWork";
import type { Goal } from "@application/entities/Goal";
import type { Profile } from "@application/entities/Profile";
import { Injectable } from "@kernel/decorators/Injectable";
import { ProfileRepository } from "../repositories/ProfileRepository";
import { AccountRepository } from "../repositories/AccountRepository";
import { GoalRepository } from "../repositories/GoalRepository";

@Injectable()
export class SignUpUnitOfWork extends UnitOfWork {
    constructor(
        private readonly profileRepository: ProfileRepository,
        private readonly accountRepository: AccountRepository,
        private readonly goalRepository: GoalRepository,
    ) {
        super();
    }

    async run({ account, goal, profile }: SignUpUnitOfWork.RunParams) {
        this.addPut(this.accountRepository.getPutCommandInput(account));
        this.addPut(this.profileRepository.getPutCommandInput(profile));
        this.addPut(this.goalRepository.getPutCommandInput(goal));

        await this.commit();
    }
}

export namespace SignUpUnitOfWork {
    export type RunParams = {
        account: Account;
        goal: Goal;
        profile: Profile;
    };
}
