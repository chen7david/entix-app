import { env } from "cloudflare:test";
import app from "@api/app";
import { lessons } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb, type TestDb } from "../lib/utils";

describe("Lesson Integration", () => {
    let db: TestDb;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("POST /api/v1/orgs/:organizationId/lessons creates a lesson with title-only payload", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        const res = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/lessons`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookie,
                },
                body: JSON.stringify({
                    title: "Lesson Test",
                }),
            }),
            {},
            env
        );

        expect(res.status).toBe(201);
        const body = (await res.json()) as {
            id: string;
            organizationId: string;
            title: string;
            description: string | null;
            coverArtUrl: string | null;
            createdAt: number;
            updatedAt: number;
        };

        expect(body.title).toBe("Lesson Test");
        expect(body.organizationId).toBe(orgId);
        expect(body.description).toBeNull();
        expect(body.coverArtUrl).toBeNull();
        expect(typeof body.createdAt).toBe("number");
        expect(typeof body.updatedAt).toBe("number");
    });

    it("GET /api/v1/orgs/:organizationId/lessons lists org-scoped lessons", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        await db.insert(lessons).values([
            { id: "lesson_list_1", organizationId: orgId, title: "Algebra" },
            { id: "lesson_list_2", organizationId: orgId, title: "Geometry" },
        ]);

        const res = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/lessons`, {
                method: "GET",
                headers: { Cookie: cookie },
            }),
            {},
            env
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as { items: Array<{ title: string }> };
        expect(body.items.length).toBeGreaterThanOrEqual(2);
        expect(body.items.some((lesson) => lesson.title === "Algebra")).toBe(true);
    });

    it("PATCH /api/v1/orgs/:organizationId/lessons/:lessonId updates lesson fields", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        await db.insert(lessons).values({
            id: "lesson_patch_1",
            organizationId: orgId,
            title: "Old Title",
            description: "Old Description",
        });

        const res = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/lessons/lesson_patch_1`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookie,
                },
                body: JSON.stringify({
                    title: "New Title",
                    description: "New Description",
                }),
            }),
            {},
            env
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as { title: string; description: string | null };
        expect(body.title).toBe("New Title");
        expect(body.description).toBe("New Description");
    });

    it("DELETE /api/v1/orgs/:organizationId/lessons/:lessonId deletes lesson", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        await db.insert(lessons).values({
            id: "lesson_delete_1",
            organizationId: orgId,
            title: "Delete Me",
        });

        const res = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/lessons/lesson_delete_1`, {
                method: "DELETE",
                headers: { Cookie: cookie },
            }),
            {},
            env
        );

        expect(res.status).toBe(204);
    });

    it("enforces cross-org isolation for GET/PATCH/DELETE lesson by id", async () => {
        const { cookie: cookieA, orgId: orgA } = await createAuthenticatedOrg({ app, env });
        const { cookie: cookieB, orgId: orgB } = await createAuthenticatedOrg({ app, env });

        await db.insert(lessons).values({
            id: "lesson_other_org",
            organizationId: orgB,
            title: "Other Org Lesson",
        });

        const getRes = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgA}/lessons/lesson_other_org`, {
                method: "GET",
                headers: { Cookie: cookieA },
            }),
            {},
            env
        );
        expect(getRes.status).toBe(404);

        const patchRes = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgA}/lessons/lesson_other_org`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookieA,
                },
                body: JSON.stringify({ title: "Should Fail" }),
            }),
            {},
            env
        );
        expect(patchRes.status).toBe(404);

        const deleteRes = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgA}/lessons/lesson_other_org`, {
                method: "DELETE",
                headers: { Cookie: cookieA },
            }),
            {},
            env
        );
        expect(deleteRes.status).toBe(404);

        const verifyRes = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgB}/lessons/lesson_other_org`, {
                method: "GET",
                headers: { Cookie: cookieB },
            }),
            {},
            env
        );
        expect(verifyRes.status).toBe(200);
    });

    it("GET /lessons supports hasCoverArt filter", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        await db.insert(lessons).values([
            {
                id: "lesson_with_art",
                organizationId: orgId,
                title: "With Art",
                coverArtUrl: "https://asset",
            },
            {
                id: "lesson_without_art",
                organizationId: orgId,
                title: "Without Art",
                coverArtUrl: null,
            },
        ]);

        const withRes = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/lessons?hasCoverArt=with`, {
                method: "GET",
                headers: { Cookie: cookie },
            }),
            {},
            env
        );
        expect(withRes.status).toBe(200);
        const withBody = (await withRes.json()) as { items: Array<{ id: string }> };
        expect(withBody.items.some((item) => item.id === "lesson_with_art")).toBe(true);
        expect(withBody.items.some((item) => item.id === "lesson_without_art")).toBe(false);

        const withoutRes = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/lessons?hasCoverArt=without`, {
                method: "GET",
                headers: { Cookie: cookie },
            }),
            {},
            env
        );
        expect(withoutRes.status).toBe(200);
        const withoutBody = (await withoutRes.json()) as { items: Array<{ id: string }> };
        expect(withoutBody.items.some((item) => item.id === "lesson_without_art")).toBe(true);
        expect(withoutBody.items.some((item) => item.id === "lesson_with_art")).toBe(false);
    });
});
