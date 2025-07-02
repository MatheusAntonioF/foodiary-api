import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import {
    confirmForgotPasswordSchema,
    type ConfirmForgotPasswordBody,
} from "./schemas/confirmForgotPasswordSchema";
import { ConfirmForgotPasswordUseCase } from "@application/useCases/auth/ConfirmForgotPasswordUseCase";
import { BadRequest } from "@application/errors/http/BadRequest";

@Injectable()
@Schema(confirmForgotPasswordSchema)
export class ConfirmForgotPasswordController extends Controller<
    "public",
    ConfirmForgotPasswordController.Response
> {
    constructor(
        private readonly confirmForgotPasswordUseCase: ConfirmForgotPasswordUseCase
    ) {
        super();
    }

    protected override async handle({
        body,
    }: Controller.Request<"public", ConfirmForgotPasswordBody>): Promise<
        Controller.Response<ConfirmForgotPasswordController.Response>
    > {
        try {
            const { email, confirmationCode, password } = body;

            await this.confirmForgotPasswordUseCase.execute({
                email,
                confirmationCode,
                password,
            });

            return {
                statusCode: 204,
            };
        } catch {
            throw new BadRequest("Error. Try again.");
        }
    }
}

export namespace ConfirmForgotPasswordController {
    export type Response = null;
}
