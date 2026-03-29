import type { AppContext } from "@api/helpers/types.helpers";
import { UploadService } from "@api/services/upload.service";
import { getBucketClient } from "./bucket.factory";
import { getUploadRepository, getUserUploadRepository } from "./repository.factory";

/**
 * Returns an UploadService bound to the current request context.
 */
export const getUploadService = (ctx: AppContext): UploadService => {
    const bucketService = getBucketClient(ctx);
    const uploadRepo = getUploadRepository(ctx);
    const userUploadRepo = getUserUploadRepository(ctx);

    const accountId = ctx.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = ctx.env.R2_BUCKET_NAME;
    const publicUrlPrefix = (
        ctx.env.PUBLIC_CDN_URL || `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`
    ).replace(/\/+$/, "");

    return new UploadService(bucketService, uploadRepo, userUploadRepo, publicUrlPrefix);
};
