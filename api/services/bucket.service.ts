import { AwsClient } from "aws4fetch";

export interface BucketConfig {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl?: string; // e.g., https://media.example.com
}

export interface UploadOptions {
    folder?: string;
    fileName?: string;
    contentType?: string;
    isPrivate?: boolean;
}

export interface UploadResponse {
    asset_id: string;
    public_id: string;
    version: number;
    format: string;
    bytes: number;
    secure_url: string;
    created_at: string;
}

export class BucketService {
    private client: AwsClient;
    private endpoint: string;
    private bucketName: string;
    private publicUrl: string;

    constructor(config: BucketConfig) {
        this.bucketName = config.bucketName;
        this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
        // Fallback to the R2 dev endpoint if no custom domain is provided
        this.publicUrl = config.publicUrl || `${this.endpoint}/${this.bucketName}`;

        this.client = new AwsClient({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            service: "s3",
            region: "auto",
        });
    }

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
            contentType = "application/octet-stream"
        } = options;

        const key = folder ? `${folder}/${fileName}` : fileName;
        const url = `${this.endpoint}/${this.bucketName}/${key}`;

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
            secure_url: `${this.publicUrl}/${key}`,
            created_at: new Date().toISOString(),
        };
    }

    /**
     * Generates a signed URL for direct client-side uploads
     * Useful for large files to bypass Worker limits
     */
    async getPresignedUploadUrl(key: string, expiresIn = 3600): Promise<string> {
        const url = new URL(`${this.endpoint}/${this.bucketName}/${key}`);
        url.searchParams.set("X-Amz-Expires", expiresIn.toString());

        const signedRequest = await this.client.sign(url.toString(), {
            method: "PUT",
        });

        return signedRequest.url;
    }

    async delete(key: string): Promise<boolean> {
        const url = `${this.endpoint}/${this.bucketName}/${key}`;
        const response = await this.client.fetch(url, { method: "DELETE" });
        return response.ok;
    }
}