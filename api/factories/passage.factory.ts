import type { AppContext } from "@api/helpers/types.helpers";
import { PassageRepository } from "@api/repositories/passage.repository";
import { PassageService } from "@api/services/passage.service";
import { getBucketClient } from "./bucket.factory";
import { getDbClient } from "./db.factory";
import { getUploadService } from "./upload.factory";

export const getPassageService = (ctx: AppContext): PassageService => {
    if (!ctx.env.PUBLIC_CDN_URL) {
        throw new Error("[passage.factory] PUBLIC_CDN_URL env var is required");
    }
    const publicUrlPrefix = ctx.env.PUBLIC_CDN_URL.replace(/\/+$/, "");

    return new PassageService(
        new PassageRepository(getDbClient(ctx)),
        getBucketClient(ctx),
        getUploadService(ctx),
        publicUrlPrefix
    );
};
