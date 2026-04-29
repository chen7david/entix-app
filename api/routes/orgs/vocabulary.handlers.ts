import { ConflictError, NotFoundError } from "@api/errors/app.error";
import {
    getSessionAttendancesRepository,
    getStudentVocabularyRepository,
    getVocabularyBankRepository,
} from "@api/factories/repository.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { VocabularyRoutes } from "./vocabulary.routes";

export class VocabularyHandlers {
    static createVocabulary: AppHandler<typeof VocabularyRoutes.createVocabulary> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const vocabularyRepo = getVocabularyBankRepository(ctx);
        const attendancesRepo = getSessionAttendancesRepository(ctx);
        const studentVocabRepo = getStudentVocabularyRepository(ctx);

        const item = await vocabularyRepo.findOrCreate(payload.text);

        if (item.status === "new") {
            await ctx.env.QUEUE.send({
                type: "vocabulary.process-text",
                vocabularyId: item.id,
            });
        }

        let assignedCount = 0;
        if (payload.sessionId) {
            const attendances = await attendancesRepo.getBySessionAndOrg(
                organizationId,
                payload.sessionId
            );

            await Promise.all(
                attendances.map((attendance) =>
                    studentVocabRepo.addIfMissing({
                        orgId: organizationId,
                        userId: attendance.userId,
                        vocabularyId: item.id,
                        attendanceId: attendance.id,
                    })
                )
            );

            assignedCount = attendances.length;
        }

        return ctx.json(
            {
                vocabulary: {
                    ...item,
                    createdAt: item.createdAt.getTime(),
                    updatedAt: item.updatedAt.getTime(),
                },
                assignedCount,
            },
            HttpStatusCodes.CREATED
        );
    };

    static listReviewVocabulary: AppHandler<typeof VocabularyRoutes.listReviewVocabulary> = async (
        ctx
    ) => {
        const vocabularyRepo = getVocabularyBankRepository(ctx);
        const items = await vocabularyRepo.getReviewItems();

        return ctx.json(
            items.map((item) => ({
                ...item,
                createdAt: item.createdAt.getTime(),
                updatedAt: item.updatedAt.getTime(),
            })),
            HttpStatusCodes.OK
        );
    };

    static listSessionVocabulary: AppHandler<typeof VocabularyRoutes.listSessionVocabulary> =
        async (ctx) => {
            const { organizationId, sessionId } = ctx.req.valid("param");
            const studentVocabRepo = getStudentVocabularyRepository(ctx);
            const items = await studentVocabRepo.getBySessionWithVocab(organizationId, sessionId);

            return ctx.json(
                items.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.getTime(),
                    vocabulary: {
                        ...item.vocabulary,
                        createdAt: item.vocabulary.createdAt.getTime(),
                        updatedAt: item.vocabulary.updatedAt.getTime(),
                    },
                })),
                HttpStatusCodes.OK
            );
        };

    static assignVocabularyToStudent: AppHandler<
        typeof VocabularyRoutes.assignVocabularyToStudent
    > = async (ctx) => {
        const { organizationId, sessionId, vocabId } = ctx.req.valid("param");
        const { userId, attendanceId } = ctx.req.valid("json");

        const attendancesRepo = getSessionAttendancesRepository(ctx);
        const studentVocabRepo = getStudentVocabularyRepository(ctx);
        const vocabularyRepo = getVocabularyBankRepository(ctx);

        const vocabulary = await vocabularyRepo.findById(vocabId);
        if (!vocabulary) {
            throw new NotFoundError("Vocabulary item not found");
        }

        const attendance = await attendancesRepo.findById(attendanceId, organizationId);
        if (!attendance) {
            throw new NotFoundError("Attendance not found");
        }
        if (attendance.sessionId !== sessionId) {
            throw new NotFoundError("Attendance does not belong to this session");
        }
        if (attendance.userId !== userId) {
            throw new NotFoundError("Attendance does not belong to this student");
        }

        const record = await studentVocabRepo.add({
            userId,
            orgId: organizationId,
            vocabularyId: vocabId,
            attendanceId,
        });
        if (!record) {
            throw new ConflictError("This vocabulary is already assigned for this attendance");
        }

        return ctx.json(
            {
                ...record,
                createdAt: record.createdAt.getTime(),
            },
            HttpStatusCodes.CREATED
        );
    };
}
