import type { AppContext } from "@api/helpers/types.helpers";
import { PassageRepository } from "@api/repositories/passage.repository";
import { PassageService } from "@api/services/passage.service";
import { getBucketClient } from "./bucket.factory";
import { getDbClient } from "./db.factory";
import { getUploadService } from "./upload.factory";

export const getPassageService = (ctx: AppContext): PassageService => {
    const accountId = ctx.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = ctx.env.R2_BUCKET_NAME;
    const publicUrlPrefix = (
        ctx.env.PUBLIC_CDN_URL || `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`
    ).replace(/\/+$/, "");

    return new PassageService(
        new PassageRepository(getDbClient(ctx)),
        getBucketClient(ctx),
        getUploadService(ctx),
        publicUrlPrefix
    );
};
