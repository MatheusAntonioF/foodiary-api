import { Injectable } from "@kernel/decorators/Injectable";
import { AuthGateway } from "src/infra/gateways/AuthGateway";

@Injectable()
export class SignUpUseCase {
    constructor(private readonly authGateway: AuthGateway) {}

    async execute({
        email,
        password,
    }: SignUpUseCase.Input): Promise<SignUpUseCase.Output> {
        const { externalId } = await this.authGateway.signUp({
            email,
            password,
        });
        console.log("🚀 ~ externalId:", externalId);

        return {
            accessToken: "asdfasdf",
            refreshToken: "refresh-token-gerado",
        };
    }
}

export namespace SignUpUseCase {
    export type Input = {
        email: string;
        password: string;
    };

    export type Output = {
        accessToken: string;
        refreshToken: string;
    };
}
