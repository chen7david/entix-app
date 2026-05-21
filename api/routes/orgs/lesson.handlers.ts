import { NotFoundError } from "@api/errors/app.error";
import { getLessonRepository } from "@api/factories/repository.factory";
import { getUploadService } from "@api/factories/upload.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { CefrLevel } from "@shared/constants/cefr";
import type { Lesson } from "@shared/db/schema";
import type { LessonRoutes } from "./lesson.routes";

function serializeLesson(lesson: Lesson) {
    return {
        ...lesson,
        cefrLevel: lesson.cefrLevel as CefrLevel | null,
        createdAt: lesson.createdAt.getTime(),
        updatedAt: lesson.updatedAt.getTime(),
    };
}

export class LessonHandlers {
    static listLessons: AppHandler<typeof LessonRoutes.listLessons> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const queryParams = ctx.req.valid("query");
        const { limit, cursor, direction, search, hasCoverArt } = queryParams;
        const repo = getLessonRepository(ctx);
        const result = await repo.listByOrganization({
            organizationId,
            limit,
            cursor,
            direction,
            search,
            hasCoverArt,
        });
        return ctx.json(
            {
                ...result,
                items: result.items.map(serializeLesson),
            },
            HttpStatusCodes.OK
        );
    };

    static createLesson: AppHandler<typeof LessonRoutes.createLesson> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const repo = getLessonRepository(ctx);
        const uploadService = getUploadService(ctx);
        let coverArtUrl: string | null = null;
        if (payload.coverArtUploadId) {
            coverArtUrl = await uploadService.getVerifiedImageUploadUrl(
                payload.coverArtUploadId,
                organizationId
            );
        }
        const lesson = await repo.create({
            organizationId,
            title: payload.title,
            description: payload.description ?? null,
            coverArtUrl,
            cefrLevel: payload.cefrLevel ?? null,
        });
        return ctx.json(serializeLesson(lesson), HttpStatusCodes.CREATED);
    };

    static getLesson: AppHandler<typeof LessonRoutes.getLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const repo = getLessonRepository(ctx);
        const lesson = await repo.findById(organizationId, lessonId);
        if (!lesson) {
            throw new NotFoundError("Lesson not found");
        }
        return ctx.json(serializeLesson(lesson), HttpStatusCodes.OK);
    };

    static updateLesson: AppHandler<typeof LessonRoutes.updateLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const repo = getLessonRepository(ctx);
        const uploadService = getUploadService(ctx);
        const currentLesson = await repo.findById(organizationId, lessonId);
        if (!currentLesson) {
            throw new NotFoundError("Lesson not found");
        }

        let coverArtUrl: string | undefined;
        if (payload.coverArtUploadId) {
            coverArtUrl = await uploadService.getVerifiedImageUploadUrl(
                payload.coverArtUploadId,
                organizationId
            );
        }

        const lesson = await repo.update(organizationId, lessonId, {
            title: payload.title,
            description: payload.description,
            ...(coverArtUrl !== undefined ? { coverArtUrl } : {}),
            ...(payload.cefrLevel !== undefined ? { cefrLevel: payload.cefrLevel } : {}),
        });
        if (!lesson) {
            throw new NotFoundError("Lesson not found");
        }

        if (coverArtUrl !== undefined && currentLesson.coverArtUrl) {
            await uploadService.deleteUploadByUrlGlobalSafely(currentLesson.coverArtUrl);
        }
        return ctx.json(serializeLesson(lesson), HttpStatusCodes.OK);
    };

    static deleteLesson: AppHandler<typeof LessonRoutes.deleteLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const repo = getLessonRepository(ctx);
        const uploadService = getUploadService(ctx);
        const lesson = await repo.findById(organizationId, lessonId);
        if (!lesson) {
            throw new NotFoundError("Lesson not found");
        }

        const deleted = await repo.delete(organizationId, lessonId);
        if (!deleted) {
            throw new NotFoundError("Lesson not found");
        }

        if (lesson.coverArtUrl) {
            await uploadService.deleteUploadByUrlGlobalSafely(lesson.coverArtUrl);
        }
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
