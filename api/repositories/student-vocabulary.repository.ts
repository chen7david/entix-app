import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, encodeCursor } from "@api/helpers/pagination.helpers";
import type { NewStudentVocabulary, StudentVocabulary } from "@shared/db/schema";
import { sessionAttendances, studentVocabulary, vocabularyBank } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

function isUniqueConstraintError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    return (
        error.message.includes("UNIQUE constraint failed") ||
        error.message.includes("SQLITE_CONSTRAINT_UNIQUE")
    );
}

export class StudentVocabularyRepository {
    constructor(private readonly db: AppDb) {}

    async add(input: Omit<NewStudentVocabulary, "id">): Promise<StudentVocabulary | null> {
        try {
            const [record] = await this.db.insert(studentVocabulary).values(input).returning();
            return record;
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                return null;
            }
            throw error;
        }
    }

    async addIfMissing(input: Omit<NewStudentVocabulary, "id">): Promise<StudentVocabulary | null> {
        try {
            const [record] = await this.db.insert(studentVocabulary).values(input).returning();
            return record;
        } catch (error) {
            if (!isUniqueConstraintError(error)) {
                throw error;
            }

            const [record] = await this.db
                .select()
                .from(studentVocabulary)
                .where(
                    and(
                        eq(studentVocabulary.userId, input.userId),
                        eq(studentVocabulary.vocabularyId, input.vocabularyId),
                        eq(studentVocabulary.attendanceId, input.attendanceId)
                    )
                )
                .limit(1);
            return record ?? null;
        }
    }

    async getByAttendance(userId: string, attendanceId: string): Promise<StudentVocabulary[]> {
        return this.db
            .select()
            .from(studentVocabulary)
            .where(
                and(
                    eq(studentVocabulary.userId, userId),
                    eq(studentVocabulary.attendanceId, attendanceId)
                )
            );
    }

    async getAllForStudent(userId: string, organizationId: string): Promise<StudentVocabulary[]> {
        return this.db
            .select()
            .from(studentVocabulary)
            .where(
                and(
                    eq(studentVocabulary.userId, userId),
                    eq(studentVocabulary.organizationId, organizationId)
                )
            );
    }

    async getByAttendanceWithVocab(userId: string, attendanceId: string) {
        return this.db
            .select({
                id: studentVocabulary.id,
                userId: studentVocabulary.userId,
                organizationId: studentVocabulary.organizationId,
                attendanceId: studentVocabulary.attendanceId,
                createdAt: studentVocabulary.createdAt,
                vocabulary: vocabularyBank,
            })
            .from(studentVocabulary)
            .innerJoin(vocabularyBank, eq(studentVocabulary.vocabularyId, vocabularyBank.id))
            .where(
                and(
                    eq(studentVocabulary.userId, userId),
                    eq(studentVocabulary.attendanceId, attendanceId)
                )
            );
    }

    async getAllForStudentWithVocab(userId: string, organizationId: string) {
        return this.db
            .select({
                id: studentVocabulary.id,
                userId: studentVocabulary.userId,
                organizationId: studentVocabulary.organizationId,
                attendanceId: studentVocabulary.attendanceId,
                createdAt: studentVocabulary.createdAt,
                vocabulary: vocabularyBank,
            })
            .from(studentVocabulary)
            .innerJoin(vocabularyBank, eq(studentVocabulary.vocabularyId, vocabularyBank.id))
            .where(
                and(
                    eq(studentVocabulary.userId, userId),
                    eq(studentVocabulary.organizationId, organizationId)
                )
            );
    }

    async getBySessionWithVocab(
        organizationId: string,
        sessionId: string,
        params: {
            limit?: number;
            direction?: "next" | "prev";
            cursorCreatedAt?: number;
            cursorId?: string;
        } = {}
    ) {
        const { limit = 20, direction = "next", cursorCreatedAt, cursorId } = params;
        const cursor =
            cursorCreatedAt !== undefined
                ? encodeCursor({
                      primary: cursorCreatedAt,
                      ...(cursorId ? { secondary: cursorId } : {}),
                  })
                : undefined;
        const pagination = buildCursorPagination(
            studentVocabulary.createdAt,
            studentVocabulary.id,
            cursor,
            direction
        );
        const conditions = [
            eq(studentVocabulary.organizationId, organizationId),
            eq(sessionAttendances.organizationId, organizationId),
            eq(sessionAttendances.sessionId, sessionId),
            ...(pagination.where ? [pagination.where] : []),
        ];

        return this.db
            .select({
                id: studentVocabulary.id,
                userId: studentVocabulary.userId,
                organizationId: studentVocabulary.organizationId,
                attendanceId: studentVocabulary.attendanceId,
                createdAt: studentVocabulary.createdAt,
                vocabulary: vocabularyBank,
            })
            .from(studentVocabulary)
            .innerJoin(vocabularyBank, eq(studentVocabulary.vocabularyId, vocabularyBank.id))
            .innerJoin(
                sessionAttendances,
                eq(studentVocabulary.attendanceId, sessionAttendances.id)
            )
            .where(and(...conditions))
            .orderBy(...pagination.orderBy)
            .limit(limit + 1);
    }

    async removeById(id: string, organizationId: string): Promise<boolean> {
        const result = await this.db
            .delete(studentVocabulary)
            .where(
                and(
                    eq(studentVocabulary.id, id),
                    eq(studentVocabulary.organizationId, organizationId)
                )
            )
            .returning();
        return result.length > 0;
    }
}
