import { NotFoundError } from "@api/errors/app.error";
import { getLessonRepository } from "@api/factories/repository.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { LessonRoutes } from "./lesson.routes";

export class LessonHandlers {
    static listLessons: AppHandler<typeof LessonRoutes.listLessons> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const repo = getLessonRepository(ctx);
        const lessons = await repo.listByOrganization(organizationId);
        return ctx.json(
            lessons.map((lesson) => ({
                ...lesson,
                createdAt: lesson.createdAt.getTime(),
                updatedAt: lesson.updatedAt.getTime(),
            })),
            HttpStatusCodes.OK
        );
    };

    static createLesson: AppHandler<typeof LessonRoutes.createLesson> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const repo = getLessonRepository(ctx);
        const lesson = await repo.create({
            organizationId,
            title: payload.title,
            description: payload.description ?? null,
        });
        return ctx.json(
            {
                ...lesson,
                createdAt: lesson.createdAt.getTime(),
                updatedAt: lesson.updatedAt.getTime(),
            },
            HttpStatusCodes.CREATED
        );
    };

    static getLesson: AppHandler<typeof LessonRoutes.getLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const repo = getLessonRepository(ctx);
        const lesson = await repo.findById(organizationId, lessonId);
        if (!lesson) {
            throw new NotFoundError("Lesson not found");
        }
        return ctx.json(
            {
                ...lesson,
                createdAt: lesson.createdAt.getTime(),
                updatedAt: lesson.updatedAt.getTime(),
            },
            HttpStatusCodes.OK
        );
    };

    static updateLesson: AppHandler<typeof LessonRoutes.updateLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const repo = getLessonRepository(ctx);
        const lesson = await repo.update(organizationId, lessonId, payload);
        if (!lesson) {
            throw new NotFoundError("Lesson not found");
        }
        return ctx.json(
            {
                ...lesson,
                createdAt: lesson.createdAt.getTime(),
                updatedAt: lesson.updatedAt.getTime(),
            },
            HttpStatusCodes.OK
        );
    };

    static deleteLesson: AppHandler<typeof LessonRoutes.deleteLesson> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const repo = getLessonRepository(ctx);
        const deleted = await repo.delete(organizationId, lessonId);
        if (!deleted) {
            throw new NotFoundError("Lesson not found");
        }
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
