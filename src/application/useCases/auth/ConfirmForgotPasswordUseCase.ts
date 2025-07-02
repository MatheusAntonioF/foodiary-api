import { Injectable } from "@kernel/decorators/Injectable";
import { AuthGateway } from "src/infra/gateways/AuthGateway";

@Injectable()
export class ConfirmForgotPasswordUseCase {
    constructor(private readonly authGateway: AuthGateway) {}

    async execute({
        email,
        confirmationCode,
        password,
    }: ConfirmForgotPasswordUseCase.Input): Promise<ConfirmForgotPasswordUseCase.Output> {
        await this.authGateway.confirmForgotPassword({
            email,
            confirmationCode,
            password,
        });
    }
}

export namespace ConfirmForgotPasswordUseCase {
    export type Input = {
        email: string;
        confirmationCode: string;
        password: string;
    };

    export type Output = void;
}
