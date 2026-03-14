import { AppContext } from "@api/helpers/types.helpers";
import { UploadService } from "@api/services/upload.service";
import { getBucketClient } from "./bucket.factory";
import { getUploadRepository } from "./repository.factory";

/**
 * Factory for creating an UploadService instance from the request context.
 *
 * This ensures the service itself remains decoupled from Hono's AppContext 
 * or the underlying Cloudflare environment, making it cleaner and easier to test.
 */
export const getUploadService = (ctx: AppContext): UploadService => {
    const bucketService = getBucketClient(ctx);
    const uploadRepo = getUploadRepository(ctx);

    const accountId = ctx.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = ctx.env.R2_BUCKET_NAME;
    const publicUrlPrefix = (ctx.env.PUBLIC_CDN_URL
        || `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`).replace(/\/+$/, "");

    return new UploadService(bucketService, uploadRepo, publicUrlPrefix);
};
