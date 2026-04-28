import type { AppDb } from "@api/factories/db.factory";
import type { Lesson, NewLesson } from "@shared/db/schema";
import { lessons } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

export class LessonRepository {
    constructor(private readonly db: AppDb) {}

    async listByOrganization(organizationId: string): Promise<Lesson[]> {
        return this.db.select().from(lessons).where(eq(lessons.organizationId, organizationId));
    }

    async findById(organizationId: string, lessonId: string): Promise<Lesson | null> {
        const [lesson] = await this.db
            .select()
            .from(lessons)
            .where(and(eq(lessons.organizationId, organizationId), eq(lessons.id, lessonId)))
            .limit(1);
        return lesson ?? null;
    }

    async create(input: NewLesson): Promise<Lesson> {
        const [lesson] = await this.db.insert(lessons).values(input).returning();
        return lesson;
    }

    async update(
        organizationId: string,
        lessonId: string,
        input: Partial<Pick<NewLesson, "title" | "description">>
    ): Promise<Lesson | null> {
        const [lesson] = await this.db
            .update(lessons)
            .set({ ...input, updatedAt: new Date() })
            .where(and(eq(lessons.organizationId, organizationId), eq(lessons.id, lessonId)))
            .returning();
        return lesson ?? null;
    }

    async delete(organizationId: string, lessonId: string): Promise<boolean> {
        const result = await this.db
            .delete(lessons)
            .where(and(eq(lessons.organizationId, organizationId), eq(lessons.id, lessonId)))
            .returning({ id: lessons.id });
        return result.length > 0;
    }
}
