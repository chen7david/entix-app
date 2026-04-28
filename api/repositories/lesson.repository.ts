import type { AppDb } from "@api/factories/db.factory";
import { wrapWildcard } from "@api/helpers/db.helpers";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import type { Lesson, NewLesson } from "@shared/db/schema";
import { lessons } from "@shared/db/schema";
import { and, eq, or, type SQL, sql } from "drizzle-orm";

export class LessonRepository {
    constructor(private readonly db: AppDb) {}

    async listByOrganization(params: {
        organizationId: string;
        limit?: number;
        cursor?: string;
        direction?: "next" | "prev";
        search?: string;
        hasCoverArt?: "all" | "with" | "without";
    }) {
        const { organizationId, limit = 20, cursor, direction = "next", search } = params;

        const { where: cursorWhere, orderBy } = buildCursorPagination(
            lessons.updatedAt,
            lessons.id,
            cursor,
            direction
        );

        const conditions: SQL[] = [eq(lessons.organizationId, organizationId)];

        const normalizedSearch = search?.trim().replace(/\s+/g, " ");
        if (normalizedSearch) {
            const searchPattern = wrapWildcard(normalizedSearch.toLowerCase());
            const searchCondition = or(
                sql`lower(${lessons.title}) like ${searchPattern}`,
                sql`lower(coalesce(${lessons.description}, '')) like ${searchPattern}`
            );
            if (searchCondition) {
                conditions.push(searchCondition);
            }
        }

        if (params.hasCoverArt === "with") {
            conditions.push(
                sql`${lessons.coverArtUrl} is not null and ${lessons.coverArtUrl} != ''`
            );
        }
        if (params.hasCoverArt === "without") {
            conditions.push(sql`${lessons.coverArtUrl} is null or ${lessons.coverArtUrl} = ''`);
        }

        if (cursorWhere) {
            conditions.push(cursorWhere);
        }

        const items = await this.db
            .select()
            .from(lessons)
            .where(and(...conditions))
            .orderBy(...orderBy)
            .limit(limit + 1);

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

    async findById(organizationId: string, lessonId: string): Promise<Lesson | null> {
        const [lesson] = await this.db
            .select()
            .from(lessons)
            .where(and(eq(lessons.organizationId, organizationId), eq(lessons.id, lessonId)))
            .limit(1);
        return lesson ?? null;
    }

    async create(input: NewLesson): Promise<Lesson> {
        const [lesson] = await this.db
            .insert(lessons)
            .values({
                ...input,
                updatedAt: new Date(),
            })
            .returning();
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
