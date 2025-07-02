import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { ForgotPasswordUseCase } from "@application/useCases/auth/ForgotPasswordUseCase";
import {
    forgotPasswordSchema,
    ForgotPasswordBody,
} from "./schemas/forgotPasswordSchema";

@Injectable()
@Schema(forgotPasswordSchema)
export class ForgotPasswordController extends Controller<
    "public",
    ForgotPasswordController.Response
> {
    constructor(private readonly forgotPasswordUseCase: ForgotPasswordUseCase) {
        super();
    }

    protected override async handle({
        body,
    }: Controller.Request<"public", ForgotPasswordBody>): Promise<
        Controller.Response<ForgotPasswordController.Response>
    > {
        try {
            await this.forgotPasswordUseCase.execute({
                email: body.email,
            });
        } catch {
            // throw new BadRequest("Failed. Try again.");
        }

        /**
         * this prevents an attacker from guessing the email address by using a brute force attack
         */
        return {
            statusCode: 204,
        };
    }
}

export namespace ForgotPasswordController {
    export type Response = null;
}
