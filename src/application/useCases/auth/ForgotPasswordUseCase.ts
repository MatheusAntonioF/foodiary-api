import { Injectable } from "@kernel/decorators/Injectable";
import { AuthGateway } from "src/infra/gateways/AuthGateway";

@Injectable()
export class ForgotPasswordUseCase {
    constructor(private readonly authGateway: AuthGateway) {}

    async execute({
        email,
    }: ForgotPasswordUseCase.Input): Promise<ForgotPasswordUseCase.Output> {
        await this.authGateway.forgotPassword({
            email,
        });
    }
}

export namespace ForgotPasswordUseCase {
    export type Input = {
        email: string;
    };

    export type Output = void;
}
