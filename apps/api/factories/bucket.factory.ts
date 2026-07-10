import type { AppContext } from "@api/helpers/types.helpers";
import { BucketService } from "@api/services/infra/bucket.service";
import { AwsClient } from "aws4fetch";

export type CloudflareR2Config = {
    accessKeyId: string;
    secretAccessKey: string;
    accountId: string;
    bucketName: string;
    publicUrl?: string;
};

/**
 * Creates an AwsClient configured for Cloudflare R2.
 */
export function createCloudflareR2Client(
    config: Pick<CloudflareR2Config, "accessKeyId" | "secretAccessKey">
): AwsClient {
    return new AwsClient({
        accessKeyId: config.accessKeyId.trim(),
        secretAccessKey: config.secretAccessKey.trim(),
        service: "s3",
        region: "auto",
    });
}

/**
 * Creates a BucketService from raw environment bindings.
 */
export const getBucketClientFromEnv = (env: CloudflareBindings): BucketService => {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = env.R2_BUCKET_NAME;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const publicUrl = env.PUBLIC_CDN_URL || `${endpoint}/${bucketName}`;

    const client = createCloudflareR2Client({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    });

    return new BucketService(client, {
        bucketName,
        endpoint,
        publicUrl,
    });
};

/**
 * Thin AppContext wrapper around getBucketClientFromEnv for request handlers.
 */
export const getBucketClient = (ctx: AppContext): BucketService => getBucketClientFromEnv(ctx.env);
