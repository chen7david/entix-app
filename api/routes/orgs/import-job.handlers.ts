import { getImportJobService } from "@api/factories/import-job.factory";
import { toMs } from "@api/helpers/date.helpers";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { ImportJob, ImportJobParagraph, TextCollection } from "@shared/db/schema";
import type { ImportJobRoutes } from "./import-job.routes";

function mapParagraph(row: ImportJobParagraph) {
    return {
        id: row.id,
        jobId: row.jobId,
        pageNumber: row.pageNumber,
        paragraphIndex: row.paragraphIndex,
        rawText: row.rawText,
        cleanedText: row.cleanedText,
        cleanStatus: row.cleanStatus,
        lastError: row.lastError,
        isDeleted: row.isDeleted,
        createdAt: toMs(row.createdAt),
        updatedAt: toMs(row.updatedAt),
    };
}

function mapJob(row: ImportJob) {
    return {
        id: row.id,
        organizationId: row.organizationId,
        collectionId: row.collectionId,
        status: row.status,
        fileName: row.fileName,
        fileType: row.fileType,
        bucketKey: row.bucketKey,
        totalParagraphs: row.totalParagraphs,
        createdBy: row.createdBy,
        createdAt: toMs(row.createdAt),
        updatedAt: toMs(row.updatedAt),
    };
}

function mapCollection(row: TextCollection) {
    return {
        id: row.id,
        organizationId: row.organizationId,
        title: row.title,
        author: row.author,
        description: row.description,
        type: row.type,
        cefrLevel: row.cefrLevel,
        bucketKey: row.bucketKey,
        r2Url: row.r2Url,
        totalPages: row.totalPages,
        createdAt: toMs(row.createdAt),
        updatedAt: toMs(row.updatedAt),
    };
}

export class ImportJobHandlers {
    static listJobs: AppHandler<typeof ImportJobRoutes.listJobs> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const service = getImportJobService(ctx);
        const jobs = await service.listJobs(organizationId);
        return ctx.json({ data: jobs.map(mapJob) }, HttpStatusCodes.OK);
    };

    static createJob: AppHandler<typeof ImportJobRoutes.createJob> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getImportJobService(ctx);
        const job = await service.createJob(organizationId, ctx.var.userId, body);
        return ctx.json({ data: mapJob(job) }, HttpStatusCodes.CREATED);
    };

    static getJob: AppHandler<typeof ImportJobRoutes.getJob> = async (ctx) => {
        const { organizationId, jobId } = ctx.req.valid("param");
        const service = getImportJobService(ctx);
        const job = await service.getJob(organizationId, jobId);
        return ctx.json(
            {
                data: {
                    ...mapJob(job),
                    paragraphs: (job.paragraphs ?? []).map(mapParagraph),
                },
            },
            HttpStatusCodes.OK
        );
    };

    static updateJob: AppHandler<typeof ImportJobRoutes.updateJob> = async (ctx) => {
        const { organizationId, jobId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getImportJobService(ctx);
        const job = await service.updateJob(organizationId, jobId, body);
        return ctx.json({ data: mapJob(job) }, HttpStatusCodes.OK);
    };

    static deleteJob: AppHandler<typeof ImportJobRoutes.deleteJob> = async (ctx) => {
        const { organizationId, jobId } = ctx.req.valid("param");
        const service = getImportJobService(ctx);
        await service.deleteJob(organizationId, jobId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static bulkInsertParagraphs: AppHandler<typeof ImportJobRoutes.bulkInsertParagraphs> =
        async (ctx) => {
            const { organizationId, jobId } = ctx.req.valid("param");
            const body = ctx.req.valid("json");
            const service = getImportJobService(ctx);
            await service.bulkInsertParagraphs(organizationId, jobId, body);
            return ctx.body(null, HttpStatusCodes.NO_CONTENT);
        };

    static updateParagraph: AppHandler<typeof ImportJobRoutes.updateParagraph> = async (ctx) => {
        const { organizationId, jobId, paragraphId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getImportJobService(ctx);
        const para = await service.updateParagraph(organizationId, jobId, paragraphId, body);
        return ctx.json({ data: mapParagraph(para) }, HttpStatusCodes.OK);
    };

    static deleteParagraph: AppHandler<typeof ImportJobRoutes.deleteParagraph> = async (ctx) => {
        const { organizationId, jobId, paragraphId } = ctx.req.valid("param");
        const service = getImportJobService(ctx);
        await service.deleteParagraph(organizationId, jobId, paragraphId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static finalizeJob: AppHandler<typeof ImportJobRoutes.finalizeJob> = async (ctx) => {
        const { organizationId, jobId } = ctx.req.valid("param");
        const body = ctx.req.valid("json");
        const service = getImportJobService(ctx);
        const collection = await service.finalizeJob(organizationId, jobId, body);
        return ctx.json({ data: mapCollection(collection) }, HttpStatusCodes.CREATED);
    };
}
