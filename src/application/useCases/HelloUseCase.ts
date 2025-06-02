import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class HelloUseCase {
    constructor() {}

    async execute(input: HelloUseCase.Input): Promise<HelloUseCase.Output> {
        return {
            helloUseCase: input.email,
        };
    }
}

export namespace HelloUseCase {
    export type Input = {
        email: string;
    };

    export type Output = {
        helloUseCase: string;
    };
}
