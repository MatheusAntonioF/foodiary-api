import KSUID from "ksuid";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { Meal } from "@application/entities/Meal";
import { Injectable } from "@kernel/decorators/Injectable";
import { s3Client } from "@infra/clients/s3Client";
import { AppConfig } from "@shared/config/AppConfig";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

@Injectable()
export class MealsFileStorageGateway {
    constructor(private readonly appConfig: AppConfig) {}

    static generateInputFileKey({
        accountId,
        contentType,
    }: MealsFileStorageGateway.GenerateInputFileKeyParams) {
        const extension = Meal.inputFileExtensions[contentType];

        const filename = `${KSUID.randomSync().string}.${extension}`;

        return `${accountId}/${filename}`;
    }

    getFileURL(fileKey: string) {
        const cdn = this.appConfig.cdns.mealsCDN;

        return `https://${cdn}/${fileKey}`;
    }

    async createPOST({
        mealId,
        accountId,
        file: { fileKey, fileSize, contentType },
    }: MealsFileStorageGateway.CreatePOSTParams): Promise<MealsFileStorageGateway.CreatePOSTResult> {
        const bucket = this.appConfig.storage.mealsBucket;

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

    async getFileMetadata({
        fileKey,
    }: MealsFileStorageGateway.GetFileMetadataParams): Promise<MealsFileStorageGateway.GetFileMetadataResult> {
        const command = new HeadObjectCommand({
            Bucket: this.appConfig.storage.mealsBucket,
            Key: fileKey,
        });

        const { Metadata = {} } = await s3Client.send(command);

        if (!Metadata.accountid || !Metadata.mealid) {
            throw new Error(`File ${fileKey} has no metadata`);
        }

        return {
            accountId: Metadata.accountid,
            mealId: Metadata.mealid,
        };
    }
}

export namespace MealsFileStorageGateway {
    export type GenerateInputFileKeyParams = {
        accountId: string;
        contentType: Meal.InputFileContentType;
    };

    export type CreatePOSTParams = {
        mealId: string;
        accountId: string;
        file: {
            fileKey: string;
            fileSize: number;
            contentType: Meal.InputFileContentType;
        };
    };

    export type CreatePOSTResult = {
        uploadSignature: string;
    };

    export type GetFileMetadataParams = {
        fileKey: string;
    };

    export type GetFileMetadataResult = {
        accountId: string;
        mealId: string;
    };
}
