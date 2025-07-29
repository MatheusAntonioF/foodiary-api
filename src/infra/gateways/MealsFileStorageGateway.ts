import KSUID from "ksuid";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { Meal } from "@application/entities/Meal";
import { Injectable } from "@kernel/decorators/Injectable";
import { s3Client } from "@infra/clients/s3Client";
import { AppConfig } from "@shared/config/AppConfig";

@Injectable()
export class MealsFileStorageGateway {
    constructor(private readonly appConfig: AppConfig) {}

    static generateInputFileKey({
        accountId,
        inputType,
    }: MealsFileStorageGateway.GenerateInputFileKeyParams) {
        const extension = inputType === Meal.InputType.AUDIO ? "m4a" : "jpeg";

        const filename = `${KSUID.randomSync().string}.${extension}`;

        return `${accountId}/${filename}`;
    }

    getFileURL(fileKey: string) {
        const cdn = this.appConfig.cdn.mealsCDN;

        return `https://${cdn}/${fileKey}`;
    }

    async createPOST({
        mealId,
        accountId,
        file: { fileKey, fileSize, inputType },
    }: MealsFileStorageGateway.CreatePOSTParams): Promise<MealsFileStorageGateway.CreatePOSTResult> {
        const bucket = this.appConfig.storage.mealsBucket;
        const contentType =
            inputType === Meal.InputType.AUDIO ? "audio/m4a" : "image/jpeg";

        const FIVE_MINUTES_IN_SECS = 5 * 60;

        const { url, fields } = await createPresignedPost(s3Client, {
            Bucket: bucket,
            Key: fileKey,
            Expires: FIVE_MINUTES_IN_SECS,
            Conditions: [
                { bucket },
                ["eq", "$key", fileKey],
                ["eq", "$Content-Type", contentType],
                ["content-length-range", fileSize, fileSize],
            ],
            Fields: {
                "x-amz-meta-mealid": mealId,
                "x-amz-meta-accountid": accountId,
            },
        });

        const uploadSignature = Buffer.from(
            JSON.stringify({
                url,
                fields: {
                    ...fields,
                    "Content-Type": contentType,
                },
            }),
        ).toString("base64");

        return {
            uploadSignature,
        };
    }
}

export namespace MealsFileStorageGateway {
    export type GenerateInputFileKeyParams = {
        accountId: string;
        inputType: Meal.InputType;
    };

    export type CreatePOSTParams = {
        mealId: string;
        accountId: string;
        file: {
            fileKey: string;
            fileSize: number;
            inputType: Meal.InputType;
        };
    };

    export type CreatePOSTResult = {
        uploadSignature: string;
    };
}
