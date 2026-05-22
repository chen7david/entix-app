import { env } from "cloudflare:test";
import app from "@api/app";
import { lessons, passages } from "@shared/db/schema";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb, type TestDb } from "../lib/utils";

let passageSchemaReady = false;

describe("Lesson Passages API", () => {
    let db: TestDb;

    beforeAll(async () => {
        const row = await env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
        )
            .bind("text_collections")
            .first();
        passageSchemaReady = Boolean(row);
    });

    beforeEach(async () => {
        db = await createTestDb();
    });

    it.skipIf(!passageSchemaReady)("links passage to lesson and reorders", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        await db.insert(lessons).values({
            id: "lesson_ps_1",
            organizationId: orgId,
            title: "Reading lesson",
            updatedAt: new Date(),
            cefrLevel: null,
        });
        const [passageA] = await db
            .insert(passages)
            .values({
                organizationId: orgId,
                title: "Passage A",
                type: "reading",
                content: "First passage text.",
                wordCount: 3,
                updatedAt: new Date(),
            })
            .returning();
        const [passageB] = await db
            .insert(passages)
            .values({
                organizationId: orgId,
                title: "Passage B",
                type: "reading",
                content: "Second passage text.",
                wordCount: 3,
                updatedAt: new Date(),
            })
            .returning();

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
});
