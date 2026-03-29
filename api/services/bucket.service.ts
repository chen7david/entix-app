import type { AwsClient } from "aws4fetch";

export type BucketConfig = {
    bucketName: string;
    endpoint: string; // e.g., https://<account_id>.r2.cloudflarestorage.com
    publicUrl: string; // e.g., https://media.example.com
};

export type UploadOptions = {
    folder?: string;
    fileName?: string;
    contentType?: string;
    isPrivate?: boolean;
};

export type UploadResponse = {
    asset_id: string;
    public_id: string;
    version: number;
    format: string;
    bytes: number;
    secure_url: string;
    created_at: string;
};

export class BucketService {
    constructor(
        private readonly client: AwsClient,
        public readonly config: BucketConfig
    ) {}

    /**
     * Uploads a file to R2 with a Cloudinary-style response
     */
    async upload(
        data: ReadableStream | ArrayBuffer | Blob | string,
        options: UploadOptions = {}
    ): Promise<UploadResponse> {
        const {
            folder = "uploads",
            fileName = crypto.randomUUID(),
            contentType = "application/octet-stream",
        } = options;

        const key = folder ? `${folder}/${fileName}` : fileName;
        const url = `${this.config.endpoint}/${this.config.bucketName}/${key}`;

        const response = await this.client.fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": contentType,
            },
            body: data,
        });

        if (!response.ok) {
            throw new Error(`R2 Upload Error: ${response.statusText} (${await response.text()})`);
        }

        return {
            asset_id: crypto.randomUUID(),
            public_id: key,
            version: Date.now(),
            format: contentType.split("/")[1] || "bin",
            bytes: data instanceof Blob ? data.size : 0, // Simplified for brevity
            secure_url: `${this.config.publicUrl}/${key}`,
            created_at: new Date().toISOString(),
        };
    }

    /**
     * Generates a signed URL for direct client-side uploads
     * Useful for large files to bypass Worker limits
     */
    async getPresignedUploadUrl(key: string, expiresIn = 3600): Promise<string> {
        const url = new URL(`${this.config.endpoint}/${this.config.bucketName}/${key}`);
        url.searchParams.set("X-Amz-Expires", expiresIn.toString());

        const signedRequest = await this.client.sign(url.toString(), {
            method: "PUT",
            aws: { signQuery: true },
        });

        return signedRequest.url;
    }

    async delete(key: string): Promise<void> {
        const url = `${this.config.endpoint}/${this.config.bucketName}/${key}`;
        const response = await this.client.fetch(url, { method: "DELETE" });

        if (response.ok || response.status === 404) {
            return;
        }

        const errorText = await response.text().catch(() => "Unknown error");
        const error = new Error(`R2 Delete Error: ${response.statusText}`) as Error & {
            status?: number;
            body?: string;
        };
        error.status = response.status;
        error.body = errorText;
        throw error;
    }
}
