import { ConflictError, NotFoundError, UnprocessableEntityError } from "@api/errors/app.error";
import { getLessonContentRepository, getLessonRepository } from "@api/factories/repository.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { LessonContentRoutes } from "./lesson-content.routes";

const toMs = (v: number | Date) => (v instanceof Date ? v.getTime() : v);

function assertOrderedIdsMatchCurrent(currentIds: string[], orderedIds: string[]): void {
    if (new Set(orderedIds).size !== orderedIds.length) {
        throw new UnprocessableEntityError("orderedIds must not contain duplicates");
    }
    if (currentIds.length !== orderedIds.length) {
        throw new UnprocessableEntityError("orderedIds must include each item exactly once");
    }
    const sortedCur = [...currentIds].sort().join("\0");
    const sortedNew = [...orderedIds].sort().join("\0");
    if (sortedCur !== sortedNew) {
        throw new UnprocessableEntityError("orderedIds must match the current items");
    }
}

export class LessonContentHandlers {
    static listObjectives: AppHandler<typeof LessonContentRoutes.listObjectives> = async (ctx) => {
        const { organizationId, lessonId } = ctx.req.valid("param");
        const lessonRepo = getLessonRepository(ctx);
        if (!(await lessonRepo.findById(organizationId, lessonId))) {
            throw new NotFoundError("Lesson not found");
        }
        const repo = getLessonContentRepository(ctx);
        const items = await repo.listObjectives(lessonId);
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
        const lessonRepo = getLessonRepository(ctx);
        if (!(await lessonRepo.findById(organizationId, lessonId))) {
            throw new NotFoundError("Lesson not found");
        }
        const repo = getLessonContentRepository(ctx);
        const items = await repo.replaceObjectives(lessonId, objectives);
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
        const lessonRepo = getLessonRepository(ctx);
        if (!(await lessonRepo.findById(organizationId, lessonId))) {
            throw new NotFoundError("Lesson not found");
        }
        const repo = getLessonContentRepository(ctx);
        const current = await repo.listObjectives(lessonId);
        const curIds = [...current].sort((a, b) => a.position - b.position).map((o) => o.id);
        assertOrderedIdsMatchCurrent(curIds, orderedIds);
        const items = await repo.reorderObjectives(lessonId, orderedIds);
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
        const lessonRepo = getLessonRepository(ctx);
        if (!(await lessonRepo.findById(organizationId, lessonId))) {
            throw new NotFoundError("Lesson not found");
        }
        const repo = getLessonContentRepository(ctx);
        const items = await repo.listPlaylists(lessonId);
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
        const lessonRepo = getLessonRepository(ctx);
        if (!(await lessonRepo.findById(organizationId, lessonId))) {
            throw new NotFoundError("Lesson not found");
        }
        const repo = getLessonContentRepository(ctx);
        const existing = await repo.listPlaylists(lessonId);
        const position = existing.length + 1;
        const row = await repo.addPlaylist(lessonId, playlistId, position);
        if (!row) {
            throw new ConflictError("This playlist is already linked to this lesson");
        }
        return ctx.json({ ...row, addedAt: toMs(row.addedAt) }, HttpStatusCodes.CREATED);
    };

    static removeLessonPlaylist: AppHandler<typeof LessonContentRoutes.removeLessonPlaylist> =
        async (ctx) => {
            const { organizationId, lessonId, playlistId } = ctx.req.valid("param");
            const lessonRepo = getLessonRepository(ctx);
            if (!(await lessonRepo.findById(organizationId, lessonId))) {
                throw new NotFoundError("Lesson not found");
            }
            const repo = getLessonContentRepository(ctx);
            const ok = await repo.removePlaylist(lessonId, playlistId);
            if (!ok) {
                throw new NotFoundError("Playlist not linked to this lesson");
            }
            return ctx.body(null, HttpStatusCodes.NO_CONTENT);
        };

    static reorderLessonPlaylists: AppHandler<typeof LessonContentRoutes.reorderLessonPlaylists> =
        async (ctx) => {
            const { organizationId, lessonId } = ctx.req.valid("param");
            const { orderedIds } = ctx.req.valid("json");
            const lessonRepo = getLessonRepository(ctx);
            if (!(await lessonRepo.findById(organizationId, lessonId))) {
                throw new NotFoundError("Lesson not found");
            }
            const repo = getLessonContentRepository(ctx);
            const current = await repo.listPlaylists(lessonId);
            const curIds = [...current]
                .sort((a, b) => a.position - b.position)
                .map((r) => r.playlistId);
            assertOrderedIdsMatchCurrent(curIds, orderedIds);
            const items = await repo.reorderPlaylists(lessonId, orderedIds);
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
            const lessonRepo = getLessonRepository(ctx);
            if (!(await lessonRepo.findById(organizationId, lessonId))) {
                throw new NotFoundError("Lesson not found");
            }
            const repo = getLessonContentRepository(ctx);
            const items = await repo.listVocabulary(lessonId);
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
        const lessonRepo = getLessonRepository(ctx);
        if (!(await lessonRepo.findById(organizationId, lessonId))) {
            throw new NotFoundError("Lesson not found");
        }
        const repo = getLessonContentRepository(ctx);
        const existing = await repo.listVocabulary(lessonId);
        const position = existing.length + 1;
        const row = await repo.addVocabulary(lessonId, vocabularyId, position);
        if (!row) {
            throw new ConflictError("This vocabulary item is already linked to this lesson");
        }
        return ctx.json({ ...row, addedAt: toMs(row.addedAt) }, HttpStatusCodes.CREATED);
    };

    static removeLessonVocabulary: AppHandler<typeof LessonContentRoutes.removeLessonVocabulary> =
        async (ctx) => {
            const { organizationId, lessonId, vocabularyId } = ctx.req.valid("param");
            const lessonRepo = getLessonRepository(ctx);
            if (!(await lessonRepo.findById(organizationId, lessonId))) {
                throw new NotFoundError("Lesson not found");
            }
            const repo = getLessonContentRepository(ctx);
            const ok = await repo.removeVocabulary(lessonId, vocabularyId);
            if (!ok) {
                throw new NotFoundError("Vocabulary word not linked to this lesson");
            }
            return ctx.body(null, HttpStatusCodes.NO_CONTENT);
        };

    static reorderLessonVocabulary: AppHandler<typeof LessonContentRoutes.reorderLessonVocabulary> =
        async (ctx) => {
            const { organizationId, lessonId } = ctx.req.valid("param");
            const { orderedIds } = ctx.req.valid("json");
            const lessonRepo = getLessonRepository(ctx);
            if (!(await lessonRepo.findById(organizationId, lessonId))) {
                throw new NotFoundError("Lesson not found");
            }
            const repo = getLessonContentRepository(ctx);
            const current = await repo.listVocabulary(lessonId);
            const curIds = [...current]
                .sort((a, b) => a.position - b.position)
                .map((r) => r.vocabularyId);
            assertOrderedIdsMatchCurrent(curIds, orderedIds);
            const items = await repo.reorderVocabulary(lessonId, orderedIds);
            return ctx.json(
                items.map((r) => ({
                    ...r,
                    addedAt: toMs(r.addedAt),
                })),
                HttpStatusCodes.OK
            );
        };
}
