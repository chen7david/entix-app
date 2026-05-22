import { env } from "cloudflare:test";
import app from "@api/app";
import { passages, textCollections } from "@shared/db/schema";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb, type TestDb } from "../lib/utils";

let passageSchemaReady = false;

describe("Passage API", () => {
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

    async function seedPassageTables(orgId: string) {
        const [collection] = await db
            .insert(textCollections)
            .values({
                id: "tc_test_1",
                organizationId: orgId,
                title: "Test Reader",
                type: "reader",
                updatedAt: new Date(),
            })
            .returning();

        const [passage] = await db
            .insert(passages)
            .values({
                id: "ps_test_1",
                organizationId: orgId,
                collectionId: collection.id,
                title: "Chapter 1",
                type: "reading",
                content: "Hello world from a short passage.",
                wordCount: 6,
                updatedAt: new Date(),
            })
            .returning();

        return { collection, passage };
    }

    it.skipIf(!passageSchemaReady)("POST /passages creates inline passage", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        const res = await app.request(`http://localhost/api/v1/orgs/${orgId}/passages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
                title: "Warm-up",
                type: "instructional",
                content: "Read this before class.",
            }),
        }, env);

        expect(res.status).toBe(201);
        const body = (await res.json()) as { data: { content?: string; wordCount: number } };
        expect(body.data.wordCount).toBe(4);
    });

    it.skipIf(!passageSchemaReady)("GET /passages/:id returns content and images array", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        const { passage } = await seedPassageTables(orgId);

        const res = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/passages/${passage.id}`,
            { headers: { Cookie: cookie } },
            env
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            data: { content: string; images: unknown[] };
        };
        expect(body.data.content).toContain("Hello world");
        expect(body.data.images).toEqual([]);
    });

    it.skipIf(!passageSchemaReady)("POST /text-collections creates collection", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        const res = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/text-collections`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({
                    title: "Grade 3 Reader",
                    type: "book",
                    author: "Test Author",
                }),
            },
            env
        );

        expect(res.status).toBe(201);
        const body = (await res.json()) as { data: { title: string; type: string } };
        expect(body.data.title).toBe("Grade 3 Reader");
        expect(body.data.type).toBe("book");
    });
});
