import { env } from "cloudflare:test";
import app from "@api/app";
import { IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE } from "@shared/constants/import";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb, skipIfImportTablesMissing } from "../lib/utils";

function makeParagraphs(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        pageNumber: Math.floor(i / 10) + 1,
        paragraphIndex: i % 10,
        rawText: `Paragraph ${i + 1} with enough text to pass validation.`,
    }));
}

describe("Import job API", () => {
    let importSchemaReady = false;

    beforeEach(async () => {
        await createTestDb();
        const row = await env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
        )
            .bind("import_jobs")
            .first();
        importSchemaReady = Boolean(row);
    });

    it("POST /imports/:jobId/paragraphs accepts a batch larger than SQLite param limit", async ({
        skip,
    }) => {
        skipIfImportTablesMissing(importSchemaReady, skip);

        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        const createRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ fileName: "Bats.pdf", fileType: "pdf" }),
            },
            env
        );
        expect(createRes.status).toBe(201);
        const { data: job } = (await createRes.json()) as { data: { id: string } };

        const paragraphCount = IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE + 50;
        const paragraphsRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports/${job.id}/paragraphs`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ paragraphs: makeParagraphs(paragraphCount) }),
            },
            env
        );
        expect(paragraphsRes.status).toBe(204);

        const getRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports/${job.id}`,
            { headers: { Cookie: cookie } },
            env
        );
        expect(getRes.status).toBe(200);
        const body = (await getRes.json()) as {
            data: { status: string; totalParagraphs: number; paragraphs: unknown[] };
        };
        expect(body.data.status).toBe("review");
        expect(body.data.totalParagraphs).toBe(paragraphCount);
        expect(body.data.paragraphs).toHaveLength(paragraphCount);
    });

    it("POST /imports/:jobId/finalize rejects jobs not in review status", async ({ skip }) => {
        skipIfImportTablesMissing(importSchemaReady, skip);

        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        const createRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ fileName: "draft.pdf", fileType: "pdf" }),
            },
            env
        );
        expect(createRes.status).toBe(201);
        const { data: job } = (await createRes.json()) as { data: { id: string } };

        const finalizeRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports/${job.id}/finalize`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ title: "Should fail", mode: "single" }),
            },
            env
        );
        expect(finalizeRes.status).toBe(400);
    });

    it("POST /imports/:jobId/finalize in single mode rejects oversized content without creating a collection", async ({
        skip,
    }) => {
        skipIfImportTablesMissing(importSchemaReady, skip);

        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        const collectionsBefore = await env.DB.prepare(
            "SELECT COUNT(*) AS count FROM text_collections WHERE organization_id = ?"
        )
            .bind(orgId)
            .first<{ count: number }>();

        const createRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ fileName: "large-book.pdf", fileType: "pdf" }),
            },
            env
        );
        expect(createRes.status).toBe(201);
        const { data: job } = (await createRes.json()) as { data: { id: string } };

        const oversizedText = "x".repeat(52_000);
        const paragraphsRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports/${job.id}/paragraphs`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({
                    paragraphs: [{ pageNumber: 1, paragraphIndex: 0, rawText: oversizedText }],
                }),
            },
            env
        );
        expect(paragraphsRes.status).toBe(204);

        const finalizeRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports/${job.id}/finalize`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Cookie: cookie },
                body: JSON.stringify({ title: "Too large", mode: "single" }),
            },
            env
        );
        expect(finalizeRes.status).toBe(400);

        const collectionsAfter = await env.DB.prepare(
            "SELECT COUNT(*) AS count FROM text_collections WHERE organization_id = ?"
        )
            .bind(orgId)
            .first<{ count: number }>();

        expect(collectionsAfter?.count).toBe(collectionsBefore?.count ?? 0);

        const getRes = await app.request(
            `http://localhost/api/v1/orgs/${orgId}/imports/${job.id}`,
            { headers: { Cookie: cookie } },
            env
        );
        expect(getRes.status).toBe(200);
        const body = (await getRes.json()) as {
            data: { status: string; collectionId: string | null };
        };
        expect(body.data.status).toBe("review");
        expect(body.data.collectionId).toBeNull();
    });
});
