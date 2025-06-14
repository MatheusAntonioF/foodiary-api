import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class SignUpUseCase {
    constructor() {}

    async execute(input: SignUpUseCase.Input): Promise<SignUpUseCase.Output> {
        console.log("🚀 ~ input:", input);
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
