import { env } from "cloudflare:test";
import { LessonContentRepository } from "@api/repositories/lesson-content.repository";
import { authOrganizations, lessons } from "@shared/db/schema";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { insertTestPassage } from "../lib/passage-fixtures";
import { createTestDb, skipIfPassageTablesMissing, type TestDb } from "../lib/utils";

describe("LessonContentRepository — lesson passages", () => {
    let passageSchemaReady = false;
    let db: TestDb;
    let repo: LessonContentRepository;
    const lessonId = "lesson_repo_ps_1";
    const orgId = "org_repo_ps_1";

    beforeAll(async () => {
        const row = await env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
        )
            .bind("lesson_passages")
            .first();
        passageSchemaReady = Boolean(row);
    });

    beforeEach(async () => {
        db = await createTestDb();
        repo = new LessonContentRepository(db);
        await db.insert(authOrganizations).values({
            id: orgId,
            name: "Repo test org",
            slug: `repo-ps-org-${lessonId}`,
            createdAt: new Date(),
        });
        await db.insert(lessons).values({
            id: lessonId,
            organizationId: orgId,
            title: "Repo test lesson",
            updatedAt: new Date(),
            cefrLevel: null,
        });
    });

    // Single Worker context: Promise.all interleaves awaits cooperatively, not cross-request D1 races.
    it("addPassage assigns positions 1 and 2 when two adds run via Promise.all (single Worker context)", async ({
        skip,
    }) => {
        skipIfPassageTablesMissing(passageSchemaReady, skip);

        const passageIdA = (await insertTestPassage(db, orgId, { title: "A" })).id;
        const passageIdB = (await insertTestPassage(db, orgId, { title: "B" })).id;

        const [rowA, rowB] = await Promise.all([
            repo.addPassage(lessonId, passageIdA),
            repo.addPassage(lessonId, passageIdB),
        ]);

        expect(rowA).toBeTruthy();
        expect(rowB).toBeTruthy();

        const rows = await repo.listPassages(lessonId);
        const positions = rows.map((r) => r.position);
        expect(new Set(positions).size).toBe(positions.length);
        expect(positions.sort((a, b) => a - b)).toEqual([1, 2]);
    });

    it("reorderPassages rejects unknown passage IDs", async ({ skip }) => {
        skipIfPassageTablesMissing(passageSchemaReady, skip);

        const passageIdA = (await insertTestPassage(db, orgId, { title: "A" })).id;
        const passageIdB = (await insertTestPassage(db, orgId, { title: "B" })).id;
        await repo.addPassage(lessonId, passageIdA);
        await repo.addPassage(lessonId, passageIdB);

        await expect(
            repo.reorderPassages(lessonId, ["passage_unknown_xyz", passageIdA])
        ).rejects.toThrow(/orderedIds must match the current items/);

        const rows = await repo.listPassages(lessonId);
        const positions = rows.map((r) => r.position).sort((a, b) => a - b);
        expect(positions).toEqual([1, 2]);
    });

    it("reorderPassages rejects empty orderedIds when lesson has passages", async ({ skip }) => {
        skipIfPassageTablesMissing(passageSchemaReady, skip);

        const passageIdA = (await insertTestPassage(db, orgId, { title: "A" })).id;
        await repo.addPassage(lessonId, passageIdA);

        await expect(repo.reorderPassages(lessonId, [])).rejects.toThrow(
            /orderedIds must include each item exactly once/
        );
    });

    it("removePassage compacts positions after deleting the middle item", async ({ skip }) => {
        skipIfPassageTablesMissing(passageSchemaReady, skip);

        const passageIdA = (await insertTestPassage(db, orgId, { title: "A" })).id;
        const passageIdB = (await insertTestPassage(db, orgId, { title: "B" })).id;
        const passageIdC = (await insertTestPassage(db, orgId, { title: "C" })).id;
        await repo.addPassage(lessonId, passageIdA);
        await repo.addPassage(lessonId, passageIdB);
        await repo.addPassage(lessonId, passageIdC);

        await repo.removePassage(lessonId, passageIdB);

        const rows = await repo.listPassages(lessonId);
        expect(rows.map((r) => r.passageId).sort()).toEqual([passageIdA, passageIdC].sort());
        expect(rows.map((r) => r.position).sort((a, b) => a - b)).toEqual([1, 2]);
    });

    it("removePassage leaving one item keeps position 1 without error", async ({ skip }) => {
        skipIfPassageTablesMissing(passageSchemaReady, skip);

        const passageIdA = (await insertTestPassage(db, orgId, { title: "A" })).id;
        const passageIdB = (await insertTestPassage(db, orgId, { title: "B" })).id;
        await repo.addPassage(lessonId, passageIdA);
        await repo.addPassage(lessonId, passageIdB);

        const removed = await repo.removePassage(lessonId, passageIdB);
        expect(removed).toBe(true);

        const rows = await repo.listPassages(lessonId);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            passageId: passageIdA,
            position: 1,
        });
    });

    it("addPassage returns joined passage metadata", async ({ skip }) => {
        skipIfPassageTablesMissing(passageSchemaReady, skip);

        const passageId = (await insertTestPassage(db, orgId, { title: "Joined", wordCount: 2 }))
            .id;
        const row = await repo.addPassage(lessonId, passageId);

        expect(row).toMatchObject({
            lessonId,
            passageId,
            position: 1,
            title: "Joined",
            type: "reading",
            wordCount: 2,
        });
    });
});
