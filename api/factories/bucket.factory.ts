import type { AppContext } from "@api/helpers/types.helpers";
import { BucketService } from "@api/services/bucket.service";

/**
 * Factory for creating a BucketService instance from the request context.
 *
 * Follows the same pattern as getDbClient — receives AppContext and reads
 * typed CloudflareBindings so the BucketService itself stays platform-agnostic.
 *
 * Usage:
 * ```typescript
 * const bucket = getBucketClient(ctx);
 * await bucket.upload(file, { folder: 'avatars' });
 * ```
 */
export const getBucketClient = (ctx: AppContext): BucketService => {
    return new BucketService({
        accountId: ctx.env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: ctx.env.R2_ACCESS_KEY_ID,
        secretAccessKey: ctx.env.R2_SECRET_ACCESS_KEY,
        bucketName: ctx.env.R2_BUCKET_NAME,
        publicUrl: ctx.env.PUBLIC_CDN_URL,
    });
};
