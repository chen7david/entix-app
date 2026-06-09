import { type Passage, passages } from "@shared/db/schema";
import type { TestDb } from "./utils";

type InsertTestPassageOpts = {
    id?: string;
    collectionId?: string | null;
    title?: string;
    content?: string;
    wordCount?: number;
    type?: Passage["type"];
};

/** Inserts a minimal inline reading passage for integration/repository tests. */
export async function insertTestPassage(
    db: TestDb,
    organizationId: string,
    opts: InsertTestPassageOpts = {}
) {
    const title = opts.title ?? "Test passage";
    const now = new Date();
    const [row] = await db
        .insert(passages)
        .values({
            ...(opts.id != null ? { id: opts.id } : {}),
            organizationId,
            ...(opts.collectionId != null ? { collectionId: opts.collectionId } : {}),
            title,
            type: opts.type ?? "reading",
            content: opts.content ?? `${title} body`,
            wordCount: opts.wordCount ?? 2,
            createdAt: now,
            updatedAt: now,
        })
        .returning();
    return row;
}
