import type { AppDb } from "@api/factories/db.factory";
import type { LessonProgress, NewLessonProgress } from "@shared/db/schema";
import { lessonProgress } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

export class LessonProgressRepository {
    constructor(private readonly db: AppDb) {}

    async create(input: NewLessonProgress): Promise<LessonProgress> {
        const [created] = await this.db.insert(lessonProgress).values(input).returning();
        return created;
    }

    async listByEnrollment(enrollId: string): Promise<LessonProgress[]> {
        return this.db.select().from(lessonProgress).where(eq(lessonProgress.enrollId, enrollId));
    }

    async deleteByEnrollment(enrollId: string): Promise<number> {
        const deleted = await this.db
            .delete(lessonProgress)
            .where(eq(lessonProgress.enrollId, enrollId))
            .returning({ logId: lessonProgress.logId });
        return deleted.length;
    }

    async deleteOne(logId: string, enrollId: string): Promise<boolean> {
        const deleted = await this.db
            .delete(lessonProgress)
            .where(and(eq(lessonProgress.logId, logId), eq(lessonProgress.enrollId, enrollId)))
            .returning({ logId: lessonProgress.logId });
        return deleted.length > 0;
    }
}
