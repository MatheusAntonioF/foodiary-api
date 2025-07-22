import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";

import { UpdateProfileUseCase } from "@application/useCases/profiles/UpdateProfileUseCase";
import { Schema } from "@kernel/decorators/Schema";
import {
    updateProfileSchema,
    type UpdateProfileBody,
} from "./schemas/updateProfileSchema";

@Injectable()
@Schema(updateProfileSchema)
export class UpdateProfileController extends Controller<
    "private",
    UpdateProfileController.Response
> {
    constructor(private readonly updateProfileUseCase: UpdateProfileUseCase) {
        super();
    }

    protected override async handle({
        accountId,
        body,
    }: Controller.Request<"private", UpdateProfileBody>): Promise<
        Controller.Response<UpdateProfileController.Response>
    > {
        const { birthDate, gender, height, name, weight } = body;

        await this.updateProfileUseCase.execute({
            accountId,
            birthDate,
            gender,
            height,
            name,
            weight,
        });

        return {
            statusCode: 204,
        };
    }
}

export namespace UpdateProfileController {
    export type Response = null;
}
