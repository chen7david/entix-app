import { getUploadService } from "@api/factories/upload.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import { stableTimestamp } from "@shared/schemas/dto/upload.dto";
import type { OrgUploadsRoutes } from "./uploads.routes";

export class OrgUploadsHandler {
    static requestPresignedUrl: AppHandler<typeof OrgUploadsRoutes.requestPresignedUrl> = async (
        ctx
    ) => {
        const { organizationId } = ctx.req.valid("param");
        const { originalName, contentType, fileSize } = ctx.req.valid("json");
        const userId = ctx.var.userId;

        if (!userId) {
            ctx.var.logger.error(
                { organizationId },
                "UserId missing from context in requestPresignedUrl"
            );
            throw new Error("Unauthorized");
        }

        try {
            const uploadService = getUploadService(ctx);
            const result = await uploadService.createPresignedUrl(
                "uploads",
                organizationId,
                userId,
                originalName,
                contentType,
                fileSize
            );

            ctx.var.logger.info(
                { uploadId: result.uploadId, organizationId },
                "Presigned URL requested"
            );

            return ctx.json(result, HttpStatusCodes.CREATED);
        } catch (error: unknown) {
            ctx.var.logger.error(
                { error, organizationId, userId },
                "Failed to request presigned URL"
            );
            throw error;
        }
    };

    static completeUpload: AppHandler<typeof OrgUploadsRoutes.completeUpload> = async (ctx) => {
        const { organizationId, uploadId } = ctx.req.valid("param");

        try {
            const uploadService = getUploadService(ctx);
            const record = await uploadService.completeUpload(uploadId, organizationId);

            ctx.var.logger.info({ uploadId, organizationId }, "Upload marked as completed");

            return ctx.json(
                {
                    ...record,
                    createdAt: stableTimestamp(record.createdAt),
                    updatedAt: stableTimestamp(record.updatedAt),
                } as any,
                HttpStatusCodes.OK
            );
        } catch (error: unknown) {
            ctx.var.logger.error({ error, uploadId, organizationId }, "Failed to complete upload");
            throw error;
        }
    };

    static listUploads: AppHandler<typeof OrgUploadsRoutes.listUploads> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");

        try {
            const uploadService = getUploadService(ctx);
            const uploads = await uploadService.listUploads(organizationId);

            ctx.var.logger.info({ organizationId, count: uploads.length }, "Uploads retrieved");

            const result = uploads.map((u) => ({
                ...u,
                createdAt: stableTimestamp(u.createdAt),
                updatedAt: stableTimestamp(u.updatedAt),
            }));

            return ctx.json(result, HttpStatusCodes.OK);
        } catch (error: unknown) {
            ctx.var.logger.error({ error, organizationId }, "Failed to list uploads");
            throw error;
        }
    };

    static deleteUpload: AppHandler<typeof OrgUploadsRoutes.deleteUpload> = async (ctx) => {
        const { organizationId, uploadId } = ctx.req.valid("param");

        try {
            const uploadService = getUploadService(ctx);
            const deleted = await uploadService.deleteUpload(uploadId, organizationId);

            if (!deleted) {
                return ctx.body(null, HttpStatusCodes.NOT_FOUND);
            }

            ctx.var.logger.info({ uploadId, organizationId }, "Upload deleted");

            return ctx.body(null, HttpStatusCodes.NO_CONTENT);
        } catch (error: unknown) {
            ctx.var.logger.error({ error, uploadId, organizationId }, "Failed to delete upload");
            throw error;
        }
    };
}
