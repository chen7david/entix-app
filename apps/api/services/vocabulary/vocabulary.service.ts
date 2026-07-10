import { ConflictError, InternalServerError, NotFoundError } from "@api/errors/app.error";
import { decodeCursor, processPaginatedResult } from "@api/helpers/pagination.helpers";
import type { SessionAttendancesRepository } from "@api/repositories/schedule/session-attendances.repository";
import type { StudentVocabularyRepository } from "@api/repositories/vocabulary/student-vocabulary.repository";
import type { VocabularyBankRepository } from "@api/repositories/vocabulary/vocabulary-bank.repository";
import type { VocabularyBankItem } from "@shared/db/schema";
import { BaseService } from "../base.service";

type CursorDirection = "next" | "prev";

export class VocabularyService extends BaseService {
    constructor(
        private readonly vocabularyRepo: VocabularyBankRepository,
        private readonly attendancesRepo: SessionAttendancesRepository,
        private readonly studentVocabRepo: StudentVocabularyRepository
    ) {
        super();
    }

    async createVocabulary(organizationId: string, payload: { text: string; sessionId?: string }) {
        const item = await this.vocabularyRepo.findOrCreate(payload.text);
        if (!item) {
            throw new InternalServerError("Failed to create or load vocabulary item");
        }

        let targetCount = 0;
        if (payload.sessionId) {
            const attendances = await this.attendancesRepo.getBySessionAndOrg(
                organizationId,
                payload.sessionId
            );

            await Promise.all(
                attendances.map(async (attendance) => {
                    await this.studentVocabRepo.addIfMissing({
                        organizationId,
                        userId: attendance.userId,
                        vocabularyId: item.id,
                        attendanceId: attendance.id,
                    });
                })
            );

            targetCount = attendances.length;
        }

        return { item, targetCount };
    }

    async listReviewVocabulary(params: {
        limit: number;
        cursor?: string;
        direction?: CursorDirection;
    }) {
        const { limit, cursor, direction = "next" } = params;
        const decoded = cursor ? decodeCursor(cursor) : null;
        const items = await this.vocabularyRepo.getReviewItems({
            limit: limit + 1,
            direction,
            cursorUpdatedAt: typeof decoded?.primary === "number" ? decoded.primary : undefined,
            cursorId: typeof decoded?.secondary === "string" ? decoded.secondary : undefined,
        });
        return processPaginatedResult(
            items,
            limit,
            direction,
            (item) => ({
                primary: item.updatedAt.getTime(),
                secondary: item.id,
            }),
            cursor
        );
    }

    async listSessionVocabulary(params: {
        organizationId: string;
        sessionId: string;
        limit: number;
        cursor?: string;
        direction?: CursorDirection;
    }) {
        const { organizationId, sessionId, limit, cursor, direction = "next" } = params;
        const decoded = cursor ? decodeCursor(cursor) : null;
        const items = await this.studentVocabRepo.getBySessionWithVocab(organizationId, sessionId, {
            limit,
            direction,
            cursorCreatedAt: typeof decoded?.primary === "number" ? decoded.primary : undefined,
            cursorId: typeof decoded?.secondary === "string" ? decoded.secondary : undefined,
        });
        return processPaginatedResult(
            items,
            limit,
            direction,
            (item) => ({ primary: item.createdAt.getTime(), secondary: item.id }),
            cursor
        );
    }

    async assignVocabularyToStudent(input: {
        organizationId: string;
        sessionId: string;
        vocabId: string;
        userId: string;
        attendanceId: string;
    }) {
        const { organizationId, sessionId, vocabId, userId, attendanceId } = input;
        const vocabulary = await this.vocabularyRepo.findById(vocabId);
        if (!vocabulary) {
            throw new NotFoundError("Vocabulary item not found");
        }

        const attendance = await this.attendancesRepo.findById(attendanceId, organizationId);
        if (!attendance) {
            throw new NotFoundError("Attendance not found");
        }
        if (attendance.sessionId !== sessionId) {
            throw new NotFoundError("Attendance does not belong to this session");
        }
        if (attendance.userId !== userId) {
            throw new NotFoundError("Attendance does not belong to this student");
        }

        const record = await this.studentVocabRepo.add({
            userId,
            organizationId,
            vocabularyId: vocabId,
            attendanceId,
        });
        if (!record) {
            throw new ConflictError("This vocabulary is already assigned for this attendance");
        }

        return record;
    }

    async removeSessionVocabulary(input: {
        organizationId: string;
        studentVocabId: string;
    }): Promise<void> {
        const { organizationId, studentVocabId } = input;
        const deleted = await this.studentVocabRepo.removeById(studentVocabId, organizationId);
        if (!deleted) {
            throw new NotFoundError("Vocabulary assignment not found");
        }
    }

    async removeVocabularyFromSession(input: {
        organizationId: string;
        sessionId: string;
        vocabId: string;
    }): Promise<void> {
        const { organizationId, sessionId, vocabId } = input;
        const attendances = await this.attendancesRepo.getBySessionAndOrg(
            organizationId,
            sessionId
        );
        const attendanceIds = attendances.map((a) => a.id);

        if (attendanceIds.length === 0) return;

        await this.studentVocabRepo.removeByVocabAndAttendances(
            organizationId,
            vocabId,
            attendanceIds
        );
    }

    async getVocabularyBankItem(vocabId: string): Promise<VocabularyBankItem | null> {
        return this.vocabularyRepo.findById(vocabId);
    }

    async listVocabularyBank(params: {
        limit: number;
        cursor?: string;
        direction?: CursorDirection;
        search?: string;
    }) {
        const { limit, cursor, direction = "next", search } = params;
        const decoded = cursor ? decodeCursor(cursor) : null;
        const items = await this.vocabularyRepo.listAll({
            limit: limit + 1,
            direction,
            cursorUpdatedAt: typeof decoded?.primary === "number" ? decoded.primary : undefined,
            cursorId: typeof decoded?.secondary === "string" ? decoded.secondary : undefined,
            search,
        });
        return processPaginatedResult(
            items,
            limit,
            direction,
            (item) => ({ primary: item.updatedAt.getTime(), secondary: item.id }),
            cursor
        );
    }

    async updateVocabularyBank(
        id: string,
        data: Partial<VocabularyBankItem>
    ): Promise<VocabularyBankItem> {
        const item = await this.vocabularyRepo.update(id, data);
        if (!item) {
            throw new NotFoundError("Vocabulary item not found");
        }
        return item;
    }

    async deleteVocabularyBank(id: string): Promise<void> {
        const deleted = await this.vocabularyRepo.delete(id);
        if (!deleted) {
            throw new NotFoundError("Vocabulary item not found");
        }
    }
}
