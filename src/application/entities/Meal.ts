import KSUID from "ksuid";

export class Meal {
    readonly id: string;
    readonly accountId: string;
    status: Meal.Status;
    attempts: number;
    inputType: Meal.InputType;
    inputFileKey: string;
    name: string;
    icon: string;
    foods: Meal.Food[];
    createdAt: Date;

    constructor(attr: Meal.Attributes) {
        this.id = attr.id ?? KSUID.randomSync().string;
        this.accountId = attr.accountId;
        this.status = attr.status;
        this.inputType = attr.inputType;
        this.inputFileKey = attr.inputFileKey;
        this.attempts = attr.attempts ?? 0;
        this.name = attr.name ?? "";
        this.icon = attr.icon ?? "";
        this.foods = attr.foods ?? [];
        this.createdAt = attr.createdAt ?? new Date();
    }
}

export namespace Meal {
    export type Attributes = {
        id?: string;
        accountId: string;
        status: Meal.Status;
        inputType: Meal.InputType;
        inputFileKey: string;
        attempts?: number;
        name?: string;
        icon?: string;
        foods?: Meal.Food[];
        createdAt?: Date;
    };

    export enum Status {
        UPLOADING = "UPLOADING",
        QUEUED = "QUEUED",
        PROCESSING = "PROCESSING",
        SUCCESS = "SUCCESS",
        FAILED = "FAILED",
    }

    export enum InputType {
        AUDIO = "AUDIO",
        PICTURE = "PICTURE",
    }

    /**
     * The content types an input file may be uploaded with, and the extension each one is
     * stored under. Audio is not a single format: expo-audio records m4a, while the web's
     * MediaRecorder produces webm/opus everywhere except Safari, which produces mp4/AAC.
     * Both are accepted natively by the transcription model, so there is nothing to transcode.
     */
    export const inputFileContentTypes = [
        "audio/m4a",
        "audio/mp4",
        "audio/webm",
        "image/jpeg",
    ] as const;

    export type InputFileContentType = (typeof inputFileContentTypes)[number];

    export const inputFileExtensions: Record<InputFileContentType, string> = {
        "audio/m4a": "m4a",
        "audio/mp4": "m4a",
        "audio/webm": "webm",
        "image/jpeg": "jpeg",
    };

    export function getInputType(
        contentType: InputFileContentType,
    ): Meal.InputType {
        return contentType.startsWith("audio/")
            ? InputType.AUDIO
            : InputType.PICTURE;
    }

    /** The content type a stored file key implies, for reading a file back out of S3. */
    export function getContentTypeFromFileKey(
        fileKey: string,
    ): InputFileContentType {
        const extension = fileKey.split(".").at(-1);

        const contentType = inputFileContentTypes.find(
            (type) => inputFileExtensions[type] === extension,
        );

        return contentType ?? "audio/m4a";
    }

    export type Food = {
        name: string;
        quantity: string;
        calories: number;
        proteins: number;
        carbohydrates: number;
        fats: number;
    };
}
