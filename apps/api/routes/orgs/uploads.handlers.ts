import { UnauthorizedError } from "@api/errors/app.error";
import { getUploadService } from "@api/factories/upload.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import { stableTimestamp, type UploadDto } from "@shared/schemas/dto/upload.dto";
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
            throw new UnauthorizedError();
        }

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
    };

    static completeUpload: AppHandler<typeof OrgUploadsRoutes.completeUpload> = async (ctx) => {
        const { organizationId, uploadId } = ctx.req.valid("param");

        const uploadService = getUploadService(ctx);
        const record = await uploadService.completeUpload(uploadId, organizationId);

        ctx.var.logger.info({ uploadId, organizationId }, "Upload marked as completed");

        const payload: UploadDto = {
            id: record.id,
            originalName: record.originalName,
            bucketKey: record.bucketKey,
            url: record.url,
            fileSize: record.fileSize,
            contentType: record.contentType,
            status: record.status,
            organizationId: record.organizationId,
            uploadedBy: record.uploadedBy,
            createdAt: stableTimestamp(record.createdAt),
            updatedAt: stableTimestamp(record.updatedAt),
        };

        return ctx.json(payload, HttpStatusCodes.OK);
    };

    static listUploads: AppHandler<typeof OrgUploadsRoutes.listUploads> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { search, type, cursor, limit, direction } = ctx.req.valid("query");

        const uploadService = getUploadService(ctx);
        const result = await uploadService.listUploads(organizationId, {
            search,
            type,
            cursor,
            limit,
            direction,
        });

        ctx.var.logger.info({ organizationId, count: result.items.length }, "Uploads retrieved");

        const items: UploadDto[] = result.items.map((u) => ({
            id: u.id,
            originalName: u.originalName,
            bucketKey: u.bucketKey,
            url: u.url,
            fileSize: u.fileSize,
            contentType: u.contentType,
            status: u.status,
            organizationId: u.organizationId,
            uploadedBy: u.uploadedBy,
            createdAt: stableTimestamp(u.createdAt),
            updatedAt: stableTimestamp(u.updatedAt),
        }));

        return ctx.json(
            {
                items,
                nextCursor: result.nextCursor,
                prevCursor: result.prevCursor,
            },
            HttpStatusCodes.OK
        );
    };

    static deleteUpload: AppHandler<typeof OrgUploadsRoutes.deleteUpload> = async (ctx) => {
        const { organizationId, uploadId } = ctx.req.valid("param");

        const uploadService = getUploadService(ctx);
        const deleted = await uploadService.deleteUpload(uploadId, organizationId);

        if (!deleted) {
            return ctx.body(null, HttpStatusCodes.NOT_FOUND);
        }

        ctx.var.logger.info({ uploadId, organizationId }, "Upload deleted");

        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
