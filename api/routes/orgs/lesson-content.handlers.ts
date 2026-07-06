import { getLessonContentService } from "@api/factories/service.factory";
import { toMs } from "@api/helpers/date.helpers";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { LessonContentRoutes } from "./lesson-content.routes";

export class LessonContentHandlers {
    static listObjectives: AppHandler<typeof LessonContentRoutes.listObjectives> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const service = getLessonContentService(ctx);
        const items = await service.listObjectives(organizationId, lessonId);
        return ctx.json(
            items.map((o) => ({
                ...o,
                createdAt: toMs(o.createdAt),
                updatedAt: toMs(o.updatedAt),
            })),
            HttpStatusCodes.OK
        );
    };

    static replaceObjectives: AppHandler<typeof LessonContentRoutes.replaceObjectives> = async (
        ctx
    ) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const { objectives } = ctx.req.valid("json");
        const service = getLessonContentService(ctx);
        const items = await service.replaceObjectives(organizationId, lessonId, objectives);
        return ctx.json(
            items.map((o) => ({
                ...o,
                createdAt: toMs(o.createdAt),
                updatedAt: toMs(o.updatedAt),
            })),
            HttpStatusCodes.OK
        );
    };

    static reorderObjectives: AppHandler<typeof LessonContentRoutes.reorderObjectives> = async (
        ctx
    ) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const { orderedIds } = ctx.req.valid("json");
        const service = getLessonContentService(ctx);
        const items = await service.reorderObjectives(organizationId, lessonId, orderedIds);
        return ctx.json(
            items.map((o) => ({
                ...o,
                createdAt: toMs(o.createdAt),
                updatedAt: toMs(o.updatedAt),
            })),
            HttpStatusCodes.OK
        );
    };

    static listLessonPlaylists: AppHandler<typeof LessonContentRoutes.listLessonPlaylists> = async (
        ctx
    ) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const service = getLessonContentService(ctx);
        const items = await service.listPlaylists(organizationId, lessonId);
        return ctx.json(
            items.map((r) => ({
                ...r,
                addedAt: toMs(r.addedAt),
            })),
            HttpStatusCodes.OK
        );
    };

    static addLessonPlaylist: AppHandler<typeof LessonContentRoutes.addLessonPlaylist> = async (
        ctx
    ) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const { playlistId } = ctx.req.valid("json");
        const service = getLessonContentService(ctx);
        const row = await service.addPlaylist(organizationId, lessonId, playlistId);
        return ctx.json({ ...row, addedAt: toMs(row.addedAt) }, HttpStatusCodes.CREATED);
    };

    static removeLessonPlaylist: AppHandler<typeof LessonContentRoutes.removeLessonPlaylist> =
        async (ctx) => {
            const { organizationId, lessonId, playlistId } = ctx.req.valid("param");
            const service = getLessonContentService(ctx);
            await service.removePlaylist(organizationId, lessonId, playlistId);
            return ctx.body(null, HttpStatusCodes.NO_CONTENT);
        };

    static reorderLessonPlaylists: AppHandler<typeof LessonContentRoutes.reorderLessonPlaylists> =
        async (ctx) => {
            const { organizationId, lessonId } = ctx.req.valid("param");
            const { orderedIds } = ctx.req.valid("json");
            const service = getLessonContentService(ctx);
            const items = await service.reorderPlaylists(organizationId, lessonId, orderedIds);
            return ctx.json(
                items.map((r) => ({
                    ...r,
                    addedAt: toMs(r.addedAt),
                })),
                HttpStatusCodes.OK
            );
        };

    static listLessonVocabulary: AppHandler<typeof LessonContentRoutes.listLessonVocabulary> =
        async (ctx) => {
            const { organizationId, lessonId } = ctx.req.valid("param");
            const service = getLessonContentService(ctx);
            const items = await service.listVocabulary(organizationId, lessonId);
            return ctx.json(
                items.map((r) => ({
                    ...r,
                    addedAt: toMs(r.addedAt),
                })),
                HttpStatusCodes.OK
            );
        };

    static addLessonVocabulary: AppHandler<typeof LessonContentRoutes.addLessonVocabulary> = async (
        ctx
    ) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const { vocabularyId } = ctx.req.valid("json");
        const service = getLessonContentService(ctx);
        const row = await service.addVocabulary(organizationId, lessonId, vocabularyId);
        return ctx.json({ ...row, addedAt: toMs(row.addedAt) }, HttpStatusCodes.CREATED);
    };

    static removeLessonVocabulary: AppHandler<typeof LessonContentRoutes.removeLessonVocabulary> =
        async (ctx) => {
            const { organizationId, lessonId, vocabularyId } = ctx.req.valid("param");
            const service = getLessonContentService(ctx);
            await service.removeVocabulary(organizationId, lessonId, vocabularyId);
            return ctx.body(null, HttpStatusCodes.NO_CONTENT);
        };

    static reorderLessonVocabulary: AppHandler<typeof LessonContentRoutes.reorderLessonVocabulary> =
        async (ctx) => {
            const { organizationId, lessonId } = ctx.req.valid("param");
            const { orderedIds } = ctx.req.valid("json");
            const service = getLessonContentService(ctx);
            const items = await service.reorderVocabulary(organizationId, lessonId, orderedIds);
            return ctx.json(
                items.map((r) => ({
                    ...r,
                    addedAt: toMs(r.addedAt),
                })),
                HttpStatusCodes.OK
            );
        };

    static listLessonPassages: AppHandler<typeof LessonContentRoutes.listLessonPassages> = async (
        ctx
    ) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const service = getLessonContentService(ctx);
        const items = await service.listPassages(organizationId, lessonId);
        return ctx.json(
            items.map((r) => ({
                ...r,
                addedAt: toMs(r.addedAt),
            })),
            HttpStatusCodes.OK
        );
    };

    static addLessonPassage: AppHandler<typeof LessonContentRoutes.addLessonPassage> = async (
        ctx
    ) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const { passageId } = ctx.req.valid("json");
        const service = getLessonContentService(ctx);
        const row = await service.addPassage(organizationId, lessonId, passageId);
        return ctx.json({ ...row, addedAt: toMs(row.addedAt) }, HttpStatusCodes.CREATED);
    };

    static removeLessonPassage: AppHandler<typeof LessonContentRoutes.removeLessonPassage> = async (
        ctx
    ) => {
        const { organizationId, lessonId, passageId } = ctx.req.valid("param");
        const service = getLessonContentService(ctx);
        await service.removePassage(organizationId, lessonId, passageId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static reorderLessonPassages: AppHandler<typeof LessonContentRoutes.reorderLessonPassages> =
        async (ctx) => {
            const { organizationId, lessonId } = ctx.req.valid("param");
            const { orderedIds } = ctx.req.valid("json");
            const service = getLessonContentService(ctx);
            const items = await service.reorderPassages(organizationId, lessonId, orderedIds);
            return ctx.json(
                items.map((r) => ({
                    ...r,
                    addedAt: toMs(r.addedAt),
                })),
                HttpStatusCodes.OK
            );
        };
}
