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
}
