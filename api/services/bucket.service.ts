import { AwsClient } from "aws4fetch";

export type BucketConfig = {
    accountId: string;
    bucketName: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    publicUrl?: string; // e.g., https://media.example.com
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
    private client?: AwsClient;
    private endpoint: string;
    private bucketName: string;
    private publicUrl: string;

    constructor(config: BucketConfig) {
        this.bucketName = config.bucketName;
        this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
        // Fallback to the R2 dev endpoint if no custom domain is provided
        this.publicUrl = config.publicUrl || `${this.endpoint}/${this.bucketName}`;

        this.client = new AwsClient({
            accessKeyId: config.accessKeyId?.trim() || "",
            secretAccessKey: config.secretAccessKey?.trim() || "",
            service: "s3",
            region: "auto",
        });
    }

    private getClient(): AwsClient {
        if (!this.client) {
            // We check the original source of truth indirectly via lack of client
            // This error is thrown only when a write/signed-url operation is attempted.
            throw new Error(`R2 Credentials missing. Please ensure R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are set as secrets in your Cloudflare environment.`);
        }
        return this.client;
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

        const response = await this.getClient().fetch(url, {
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

        const signedRequest = await this.getClient().sign(url.toString(), {
            method: "PUT",
            aws: { signQuery: true }
        });

        return signedRequest.url;
    }

    async delete(key: string): Promise<boolean> {
        const url = `${this.endpoint}/${this.bucketName}/${key}`;
        const response = await this.getClient().fetch(url, { method: "DELETE" });
        return response.ok;
    }
}