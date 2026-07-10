import { getLessonService } from "@api/factories/service.factory";
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
        const service = getLessonService(ctx);
        const result = await service.listByOrganization({
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
        const service = getLessonService(ctx);
        const lesson = await service.createLesson(organizationId, {
            title: payload.title,
            description: payload.description,
            coverArtUploadId: payload.coverArtUploadId,
            cefrLevel: payload.cefrLevel,
        });
        return ctx.json(serializeLesson(lesson), HttpStatusCodes.CREATED);
    };

    static getLesson: AppHandler<typeof LessonRoutes.getLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const service = getLessonService(ctx);
        const lesson = await service.getLesson(organizationId, lessonId);
        return ctx.json(serializeLesson(lesson), HttpStatusCodes.OK);
    };

    static updateLesson: AppHandler<typeof LessonRoutes.updateLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const service = getLessonService(ctx);
        const lesson = await service.updateLesson(organizationId, lessonId, {
            title: payload.title,
            description: payload.description,
            coverArtUploadId: payload.coverArtUploadId,
            cefrLevel: payload.cefrLevel,
        });
        return ctx.json(serializeLesson(lesson), HttpStatusCodes.OK);
    };

    static deleteLesson: AppHandler<typeof LessonRoutes.deleteLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const service = getLessonService(ctx);
        await service.deleteLesson(organizationId, lessonId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
