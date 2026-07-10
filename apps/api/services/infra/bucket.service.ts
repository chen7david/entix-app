import { InternalServerError, NotFoundError } from "@api/errors/app.error";
import type { AwsClient } from "aws4fetch";
import { BaseService } from "../base.service";

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

export class BucketService extends BaseService {
    constructor(
        private readonly client: AwsClient,
        public readonly config: BucketConfig
    ) {
        super();
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
            throw new InternalServerError(
                `R2 Upload Error: ${response.statusText} (${await response.text()})`
            );
        }

        const bytes =
            data instanceof Blob ? data.size : data instanceof ArrayBuffer ? data.byteLength : 0;

        return {
            asset_id: crypto.randomUUID(),
            public_id: key,
            version: Date.now(),
            format: contentType.split("/")[1] || "bin",
            bytes,
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

        if (!signedRequest) {
            throw new InternalServerError(
                "Failed to generate presigned upload URL: AWS client signing failed"
            );
        }

        return signedRequest.url;
    }

    /**
     * Reads an R2 object into memory as text. Suitable for small JSON blobs (e.g. single-passage
     * `PassageR2Content`). Do not use for large collection page files without a size guard or streaming.
     */
    async get(key: string): Promise<string> {
        const url = `${this.config.endpoint}/${this.config.bucketName}/${key}`;
        const response = await this.client.fetch(url, { method: "GET" });

        if (response.status === 404) {
            throw new NotFoundError(`Object not found: ${key}`);
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new InternalServerError(`R2 Get Error: ${response.statusText} - ${errorText}`);
        }

        return response.text();
    }

    async delete(key: string): Promise<void> {
        const url = `${this.config.endpoint}/${this.config.bucketName}/${key}`;
        const response = await this.client.fetch(url, { method: "DELETE" });

        if (response.ok || response.status === 404) {
            return;
        }

        const errorText = await response.text().catch(() => "Unknown error");
        throw new InternalServerError(`R2 Delete Error: ${response.statusText} - ${errorText}`);
    }
}
