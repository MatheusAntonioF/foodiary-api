import { promises as fs } from "fs";
import path from "path";

const API_URL = "https://8mh4ss2pja.execute-api.us-east-1.amazonaws.com/meals";
const TOKEN =
    "eyJraWQiOiJkYTUyYVwvUkZoNkFxRzZ2dkRlNjdIZ1Z1UksyVUxJYVpXMnVHUmQ2bFFPTT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJjNGQ4YzRkOC03MGQxLTcwMjItMzEwNS03MGNjNjA3YmE3NDUiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9QYzRJNTk5SVYiLCJjbGllbnRfaWQiOiIzaXJhcmswaW5kamRqNms3djVxY3U0ZTIzYyIsIm9yaWdpbl9qdGkiOiI2MDEwYjdiNy1kNmI5LTRmMDAtYjhlMy00YTU5MDU5YWFhODkiLCJpbnRlcm5hbElkIjoiMzBDVEsxNjNaUkdPeElUVnRIdWtmUXl0V3RxIiwiZXZlbnRfaWQiOiJjOTc5NWVkYS1hMDVlLTRjODYtODdlYy03MmIxNGE4MzMzNzMiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNzU1MjAzODIxLCJleHAiOjE3NTUyNDcwMjEsImlhdCI6MTc1NTIwMzgyMSwianRpIjoiODg1OWQxYWYtNmY4Yi00YWU5LThlZDgtNTIwODc3ZWI1YmU2IiwidXNlcm5hbWUiOiJjNGQ4YzRkOC03MGQxLTcwMjItMzEwNS03MGNjNjA3YmE3NDUifQ.NizQB552v6FQxqXJCnEhYEEoZGhaJgyoQNgdLStyVOChHfyGOpdh037njIllm5X4n83almCKHWkrTNmQ0S0J2pFqV2znl6Sw04bZD1cPxY__LfwfXcRJpJ-9F624t50TSz5oSIZ7dl5jAPusfz3yvU6xWn0q4_uLX8dJC3D0Pc5oZG1ahflBdufJrDpbUrtGcVDv6jTrwduuLvF1p_VaaByDpFd7TV9fzKTNKx9P5GKGs0z9d4CYICOMlUai4g5jKNwHy9kduptS9ebTvhls57YqPz2Ml14iSqOemKlXDqt5i-6XDuYK3X22wDPB6Y4cYyiiSZyArq4LVIgDq2-_dQ";

interface IPresignResponse {
    uploadSignature: string;
}

interface IPresignDecoded {
    url: string;
    fields: Record<string, string>;
}

async function readImageFile(filePath: string): Promise<{
    data: Buffer;
    size: number;
    type: string;
}> {
    console.log(`🔍 Reading file from disk: ${filePath}`);
    const data = await fs.readFile(filePath);
    return {
        data,
        size: data.length,
        type: "image/jpeg",
    };
}

async function createMeal(
    fileType: string,
    fileSize: number,
): Promise<IPresignDecoded> {
    console.log(
        `🚀 Requesting presigned POST for ${fileSize} bytes of type ${fileType}`,
    );
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ file: { type: fileType, size: fileSize } }),
    });

    if (!res.ok) {
        throw new Error(
            `Failed to get presigned POST: ${res.status} ${res.statusText}`,
        );
    }

    const json = (await res.json()) as IPresignResponse;
    const decoded = JSON.parse(
        Buffer.from(json.uploadSignature, "base64").toString("utf-8"),
    ) as IPresignDecoded;

    console.log("✅ Received presigned POST data");
    return decoded;
}

function buildFormData(
    fields: Record<string, string>,
    fileData: Buffer,
    filename: string,
    fileType: string,
): FormData {
    console.log(
        `📦 Building FormData with ${Object.keys(fields).length} fields and file ${filename}`,
    );
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        form.append(key, value);
    }
    const blob = new Blob([fileData], { type: fileType });
    form.append("file", blob, filename);
    return form;
}

async function uploadToS3(url: string, form: FormData): Promise<void> {
    console.log(`📤 Uploading to S3 at ${url}`);
    const res = await fetch(url, {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `S3 upload failed: ${res.status} ${res.statusText} — ${text}`,
        );
    }

    console.log("🎉 Upload completed successfully");
}

async function uploadMealImage(filePath: string): Promise<void> {
    try {
        const { data, size, type } = await readImageFile(filePath);
        const { url, fields } = await createMeal(type, size);
        const form = buildFormData(fields, data, path.basename(filePath), type);
        await uploadToS3(url, form);
    } catch (err) {
        console.error("❌ Error during uploadMealImage:", err);
        throw err;
    }
}

uploadMealImage(path.resolve(__dirname, "assets", "meal.jpg")).catch(() =>
    process.exit(1),
);
