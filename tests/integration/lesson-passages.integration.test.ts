import { env } from "cloudflare:test";
import app from "@api/app";
import type { LessonPassageRowDto } from "@api/routes/orgs/lesson-content.routes";
import { lessons } from "@shared/db/schema";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { insertTestPassage } from "../lib/passage-fixtures";
import { createTestDb, type TestDb } from "../lib/utils";

describe("Lesson Passages API", () => {
    let passageSchemaReady = false;
    let db: TestDb;

    beforeAll(async () => {
        await createTestDb();
        const row = await env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
        )
            .bind("lesson_passages")
            .first();
        passageSchemaReady = Boolean(row);
        expect(passageSchemaReady).toBe(true);
    });

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("links passage to lesson and reorders", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        await db.insert(lessons).values({
            id: "lesson_ps_1",
            organizationId: orgId,
            title: "Reading lesson",
            updatedAt: new Date(),
            cefrLevel: null,
        });
        const passageA = await insertTestPassage(db, orgId, {
            title: "Passage A",
            content: "First passage text.",
            wordCount: 3,
        });
        const passageB = await insertTestPassage(db, orgId, {
            title: "Passage B",
            content: "Second passage text.",
            wordCount: 3,
        });

        const addA = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/lessons/lesson_ps_1/passages`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ passageId: passageA.id }),
            },
            env
        );
        expect(addA.status).toBe(201);
        const bodyA = (await addA.json()) as LessonPassageRowDto;
        expect(bodyA).toMatchObject({
            lessonId: "lesson_ps_1",
            passageId: passageA.id,
            position: 1,
            title: "Passage A",
            type: "reading",
        });
        expect(typeof bodyA.addedAt).toBe("number");

        const addB = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/lessons/lesson_ps_1/passages`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ passageId: passageB.id }),
            },
            env
        );
        expect(addB.status).toBe(201);

        const reorder = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/lessons/lesson_ps_1/passages/reorder`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ orderedIds: [passageB.id, passageA.id] }),
            },
            env
        );
        expect(reorder.status).toBe(200);
        const rows = (await reorder.json()) as Array<{ passageId: string; position: number }>;
        expect(rows.map((r) => r.passageId)).toEqual([passageB.id, passageA.id]);
        expect(rows.map((r) => r.position)).toEqual([1, 2]);
    });

    it("POST duplicate passage returns 409 already linked", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        await db.insert(lessons).values({
            id: "lesson_ps_dup",
            organizationId: orgId,
            title: "Dup lesson",
            updatedAt: new Date(),
            cefrLevel: null,
        });
        const passage = await insertTestPassage(db, orgId, {
            title: "Once",
            content: "text",
            wordCount: 1,
        });

        const first = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/lessons/lesson_ps_dup/passages`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ passageId: passage.id }),
            },
            env
        );
        expect(first.status).toBe(201);

        const second = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/lessons/lesson_ps_dup/passages`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ passageId: passage.id }),
            },
            env
        );
        expect(second.status).toBe(409);
        const errBody = (await second.json()) as { message: string };
        expect(errBody.message).toMatch(/already linked/i);
    });
});
