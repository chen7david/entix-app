import type { AppDb } from "@api/factories/db.factory";
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

    async addIfMissing(input: Omit<NewStudentVocabulary, "id">): Promise<StudentVocabulary> {
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

            if (!record) {
                throw new Error(
                    `addIfMissing: row missing after conflict (userId=${input.userId}, vocabularyId=${input.vocabularyId}, attendanceId=${input.attendanceId})`
                );
            }

            return record;
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

    async getAllForStudent(userId: string, orgId: string): Promise<StudentVocabulary[]> {
        return this.db
            .select()
            .from(studentVocabulary)
            .where(and(eq(studentVocabulary.userId, userId), eq(studentVocabulary.orgId, orgId)));
    }

    async getByAttendanceWithVocab(userId: string, attendanceId: string) {
        return this.db
            .select({
                id: studentVocabulary.id,
                userId: studentVocabulary.userId,
                orgId: studentVocabulary.orgId,
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

    async getAllForStudentWithVocab(userId: string, orgId: string) {
        return this.db
            .select({
                id: studentVocabulary.id,
                userId: studentVocabulary.userId,
                orgId: studentVocabulary.orgId,
                attendanceId: studentVocabulary.attendanceId,
                createdAt: studentVocabulary.createdAt,
                vocabulary: vocabularyBank,
            })
            .from(studentVocabulary)
            .innerJoin(vocabularyBank, eq(studentVocabulary.vocabularyId, vocabularyBank.id))
            .where(and(eq(studentVocabulary.userId, userId), eq(studentVocabulary.orgId, orgId)));
    }

    async getBySessionWithVocab(orgId: string, sessionId: string) {
        return this.db
            .select({
                id: studentVocabulary.id,
                userId: studentVocabulary.userId,
                orgId: studentVocabulary.orgId,
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
            .where(
                and(
                    eq(studentVocabulary.orgId, orgId),
                    eq(sessionAttendances.organizationId, orgId),
                    eq(sessionAttendances.sessionId, sessionId)
                )
            );
    }
}
