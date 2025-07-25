import { promises as fs } from "fs";
import path from "path";

const API_URL = "https://8mh4ss2pja.execute-api.us-east-1.amazonaws.com/meals";
const TOKEN =
    "eyJraWQiOiJkYTUyYVwvUkZoNkFxRzZ2dkRlNjdIZ1Z1UksyVUxJYVpXMnVHUmQ2bFFPTT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJjNGQ4YzRkOC03MGQxLTcwMjItMzEwNS03MGNjNjA3YmE3NDUiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9QYzRJNTk5SVYiLCJjbGllbnRfaWQiOiIzaXJhcmswaW5kamRqNms3djVxY3U0ZTIzYyIsIm9yaWdpbl9qdGkiOiI1MjliY2M2NS01YmI4LTRkZGYtOWYxNi0xNmNmNzBhYzZhYjYiLCJpbnRlcm5hbElkIjoiMzBDVEsxNjNaUkdPeElUVnRIdWtmUXl0V3RxIiwiZXZlbnRfaWQiOiIyODIzZmI0Ny00ZThhLTRmNjQtODM0YS1iNGU1MzAyMzBjM2UiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNzUzMTMwNDg5LCJleHAiOjE3NTMxNzM2ODksImlhdCI6MTc1MzEzMDQ4OSwianRpIjoiNjlkM2ZiMzctY2M5Ni00ZDQzLThmYmYtNGY4OWI0YTYwZWU0IiwidXNlcm5hbWUiOiJjNGQ4YzRkOC03MGQxLTcwMjItMzEwNS03MGNjNjA3YmE3NDUifQ.lMzyb1tpk_XvHjNeatrirENA18FS6KArD0U2hNtDfGyERcMyr7m7AoWIKGkxKAkmcIwWdR6xuAQTT1Oz9IPAloMc7oz4XoEzIey_V4mqaV8fbdhWXaiGRtWW6KIibmsKEjhCWsFh90i7gTX4tNLc_GT_gEEMweKdT36EaeXn5mdnakn256-zDtPjULR2ithq-Ju6RtHsl-LL3OH4YL-bT3PEdb48BsHxkCCMbDOktd8cqARnPhgMn7t2yET5f-4WuGTRNDB-X-Sc27PrqVIJW9zJJOqgf-ivRLxNQsB7LYSEKzJDEOfw-a0ljSx7M_VgT8oIAhAsye1JMXFpbTZmQw";

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

uploadMealImage(path.resolve(__dirname, "assets", "cover.jpeg")).catch(() =>
    process.exit(1),
);
