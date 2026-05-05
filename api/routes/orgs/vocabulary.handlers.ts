import { getVocabularyService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { VocabularyRoutes } from "./vocabulary.routes";

export class VocabularyHandlers {
    static createVocabulary: AppHandler<typeof VocabularyRoutes.createVocabulary> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const service = getVocabularyService(ctx);
        const { item, targetCount } = await service.createVocabulary(organizationId, payload);

        return ctx.json(
            {
                data: {
                    vocabulary: {
                        ...item,
                        createdAt: item.createdAt.getTime(),
                        updatedAt: item.updatedAt.getTime(),
                    },
                    targetCount,
                },
            },
            HttpStatusCodes.CREATED
        );
    };

    static listReviewVocabulary: AppHandler<typeof VocabularyRoutes.listReviewVocabulary> = async (
        ctx
    ) => {
        const { limit, cursor, direction } = ctx.req.valid("query");
        const service = getVocabularyService(ctx);
        const result = await service.listReviewVocabulary({ limit, cursor, direction });

        return ctx.json(
            {
                data: result.items.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.getTime(),
                    updatedAt: item.updatedAt.getTime(),
                })),
                nextCursor: result.nextCursor,
                prevCursor: result.prevCursor,
            },
            HttpStatusCodes.OK
        );
    };

    static listSessionVocabulary: AppHandler<typeof VocabularyRoutes.listSessionVocabulary> =
        async (ctx) => {
            const { organizationId, sessionId } = ctx.req.valid("param");
            const { limit, cursor, direction } = ctx.req.valid("query");
            const service = getVocabularyService(ctx);
            const result = await service.listSessionVocabulary({
                organizationId,
                sessionId,
                limit,
                cursor,
                direction,
            });

            return ctx.json(
                {
                    data: result.items.map((item) => ({
                        ...item,
                        createdAt: item.createdAt.getTime(),
                        vocabulary: {
                            ...item.vocabulary,
                            createdAt: item.vocabulary.createdAt.getTime(),
                            updatedAt: item.vocabulary.updatedAt.getTime(),
                        },
                    })),
                    nextCursor: result.nextCursor,
                    prevCursor: result.prevCursor,
                },
                HttpStatusCodes.OK
            );
        };

    static assignVocabularyToStudent: AppHandler<
        typeof VocabularyRoutes.assignVocabularyToStudent
    > = async (ctx) => {
        const { organizationId, sessionId, vocabId } = ctx.req.valid("param");
        const { userId, attendanceId } = ctx.req.valid("json");

        const service = getVocabularyService(ctx);
        const record = await service.assignVocabularyToStudent({
            organizationId,
            sessionId,
            vocabId,
            userId,
            attendanceId,
        });

        return ctx.json(
            {
                data: {
                    ...record,
                    createdAt: record.createdAt.getTime(),
                },
            },
            HttpStatusCodes.CREATED
        );
    };

    static removeSessionVocabulary: AppHandler<typeof VocabularyRoutes.removeSessionVocabulary> =
        async (ctx) => {
            const { organizationId, studentVocabId } = ctx.req.valid("param");
            const service = getVocabularyService(ctx);
            await service.removeSessionVocabulary({ organizationId, studentVocabId });
            return ctx.body(null, HttpStatusCodes.NO_CONTENT);
        };

    static removeVocabularyFromSession: AppHandler<
        typeof VocabularyRoutes.removeVocabularyFromSession
    > = async (ctx) => {
        const { organizationId, sessionId, vocabId } = ctx.req.valid("param");
        const service = getVocabularyService(ctx);
        await service.removeVocabularyFromSession({ organizationId, sessionId, vocabId });
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static listVocabularyBank: AppHandler<typeof VocabularyRoutes.listVocabularyBank> = async (
        ctx
    ) => {
        const { limit, cursor, direction, search } = ctx.req.valid("query");
        const service = getVocabularyService(ctx);
        const result = await service.listVocabularyBank({ limit, cursor, direction, search });
        return ctx.json(
            {
                data: result.items.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.getTime(),
                    updatedAt: item.updatedAt.getTime(),
                })),
                nextCursor: result.nextCursor,
                prevCursor: result.prevCursor,
            },
            HttpStatusCodes.OK
        );
    };

    static updateVocabularyBank: AppHandler<typeof VocabularyRoutes.updateVocabularyBank> = async (
        ctx
    ) => {
        const { vocabId } = ctx.req.valid("param");
        const data = ctx.req.valid("json");
        const service = getVocabularyService(ctx);
        const item = await service.updateVocabularyBank(vocabId, data);
        return ctx.json(
            {
                data: {
                    ...item,
                    createdAt: item.createdAt.getTime(),
                    updatedAt: item.updatedAt.getTime(),
                },
            },
            HttpStatusCodes.OK
        );
    };

    static deleteVocabularyBank: AppHandler<typeof VocabularyRoutes.deleteVocabularyBank> = async (
        ctx
    ) => {
        const { vocabId } = ctx.req.valid("param");
        const service = getVocabularyService(ctx);
        await service.deleteVocabularyBank(vocabId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
