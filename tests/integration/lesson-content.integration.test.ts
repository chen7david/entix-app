import { env } from "cloudflare:test";
import app from "@api/app";
import { lessonObjectives, lessons, playlists, vocabularyBank } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb, type TestDb } from "../lib/utils";

describe("Lesson Content API", () => {
    let db: TestDb;

    beforeEach(async () => {
        db = await createTestDb();
    });

    async function seedLessonFixture() {
        const { cookie, orgId, orgData } = await createAuthenticatedOrg({ app, env });
        const ownerId = orgData.data.user.id;
        await db.insert(lessons).values({
            id: "lesson_content_1",
            organizationId: orgId,
            title: "Lesson with content",
            updatedAt: new Date(),
            cefrLevel: null,
        });
        await db.insert(playlists).values({
            id: "playlist_lc_1",
            organizationId: orgId,
            title: "Test playlist",
            createdBy: ownerId,
            updatedAt: new Date(),
        });
        await db.insert(playlists).values({
            id: "playlist_lc_2",
            organizationId: orgId,
            title: "Test playlist 2",
            createdBy: ownerId,
            updatedAt: new Date(),
        });
        const [vb] = await db
            .insert(vocabularyBank)
            .values({
                text: "sample-word",
                status: "active",
                updatedAt: new Date(),
            })
            .returning({ id: vocabularyBank.id });
        const [vb2] = await db
            .insert(vocabularyBank)
            .values({
                text: "sample-word-2",
                status: "active",
                updatedAt: new Date(),
            })
            .returning({ id: vocabularyBank.id });
        return {
            cookie,
            orgId,
            lessonId: "lesson_content_1",
            playlistId: "playlist_lc_1",
            playlistId2: "playlist_lc_2",
            vocabularyId: vb.id,
            vocabularyId2: vb2.id,
        };
    }

    describe("objectives", () => {
        it("PUT objectives returns ordered objectives", async () => {
            const { cookie, orgId, lessonId } = await seedLessonFixture();
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/objectives`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ objectives: ["first", " second "] }),
                },
                env
            );
            expect(res.status).toBe(200);
            const body = (await res.json()) as Array<{ objective: string; position: number }>;
            expect(body).toHaveLength(2);
            expect(body.map((x) => x.objective)).toEqual(["first", "second"]);
            expect(body.map((x) => x.position)).toEqual([1, 2]);
        });

        it("PUT objectives with empty array clears all", async () => {
            const { cookie, orgId, lessonId } = await seedLessonFixture();
            await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/objectives`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ objectives: ["a"] }),
                },
                env
            );
            const clear = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/objectives`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ objectives: [] }),
                },
                env
            );
            expect(clear.status).toBe(200);
            const remaining = await db.select().from(lessonObjectives);
            expect(remaining.some((r) => r.lessonId === lessonId)).toBe(false);
        });

        it("PUT objectives with blank or whitespace-only strings returns 400", async () => {
            const { cookie, orgId, lessonId } = await seedLessonFixture();
            for (const objectives of [[""] as const, ["   "] as const]) {
                const res = await app.request(
                    `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/objectives`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Cookie: cookie,
                        },
                        body: JSON.stringify({ objectives }),
                    },
                    env
                );
                await res.text();
                expect(res.status).toBe(400);
            }
        });

        it("GET objectives for missing lesson returns 404", async () => {
            const { cookie, orgId } = await seedLessonFixture();
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/missing-lesson-id/objectives`,
                {
                    method: "GET",
                    headers: { Cookie: cookie },
                },
                env
            );
            await res.text();
            expect(res.status).toBe(404);
        });

        it("PUT objectives reorder returns new order", async () => {
            const { cookie, orgId, lessonId } = await seedLessonFixture();
            const put = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/objectives`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ objectives: ["one", "two", "three"] }),
                },
                env
            );
            expect(put.status).toBe(200);
            const created = (await put.json()) as Array<{ id: string; objective: string }>;
            expect(created).toHaveLength(3);
            const first = created[0];
            const second = created[1];
            const third = created[2];
            if (first === undefined || second === undefined || third === undefined) {
                throw new Error("expected three objectives from PUT");
            }
            const reorder = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/objectives/reorder`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({
                        orderedIds: [third.id, first.id, second.id],
                    }),
                },
                env
            );
            expect(reorder.status).toBe(200);
            const body = (await reorder.json()) as Array<{ objective: string; position: number }>;
            expect(body.map((x) => x.objective)).toEqual(["three", "one", "two"]);
            expect(body.map((x) => x.position)).toEqual([1, 2, 3]);
        });
    });

    describe("playlists", () => {
        it("POST playlist links playlist and returns 201", async () => {
            const { cookie, orgId, lessonId, playlistId } = await seedLessonFixture();
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ playlistId }),
                },
                env
            );
            expect(res.status).toBe(201);
        });

        it("POST same playlist twice second returns 409", async () => {
            const { cookie, orgId, lessonId, playlistId } = await seedLessonFixture();
            const first = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ playlistId }),
                },
                env
            );
            expect(first.status).toBe(201);
            const second = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ playlistId }),
                },
                env
            );
            await second.text();
            expect(second.status).toBe(409);
        });

        it("DELETE linked playlist returns 204", async () => {
            const { cookie, orgId, lessonId, playlistId } = await seedLessonFixture();
            await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ playlistId }),
                },
                env
            );
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists/${playlistId}`,
                {
                    method: "DELETE",
                    headers: { Cookie: cookie },
                },
                env
            );
            expect(res.status).toBe(204);
        });

        it("DELETE unlinked playlist returns 404", async () => {
            const { cookie, orgId, lessonId } = await seedLessonFixture();
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists/not_linked`,
                {
                    method: "DELETE",
                    headers: { Cookie: cookie },
                },
                env
            );
            await res.text();
            expect(res.status).toBe(404);
        });

        it("PUT playlists reorder returns new order", async () => {
            const { cookie, orgId, lessonId, playlistId, playlistId2 } = await seedLessonFixture();
            const first = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ playlistId }),
                },
                env
            );
            expect(first.status).toBe(201);
            const second = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ playlistId: playlistId2 }),
                },
                env
            );
            expect(second.status).toBe(201);
            const reorder = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/playlists/reorder`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ orderedIds: [playlistId2, playlistId] }),
                },
                env
            );
            expect(reorder.status).toBe(200);
            const body = (await reorder.json()) as Array<{ playlistId: string; position: number }>;
            expect(body.map((r) => r.playlistId)).toEqual([playlistId2, playlistId]);
            expect(body.map((r) => r.position)).toEqual([1, 2]);
        });
    });

    describe("lesson vocabulary links", () => {
        it("POST vocabulary links word and returns 201", async () => {
            const { cookie, orgId, lessonId, vocabularyId } = await seedLessonFixture();
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ vocabularyId }),
                },
                env
            );
            expect(res.status).toBe(201);
        });

        it("POST same vocabulary twice second returns 409", async () => {
            const { cookie, orgId, lessonId, vocabularyId } = await seedLessonFixture();
            const first = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ vocabularyId }),
                },
                env
            );
            expect(first.status).toBe(201);
            const second = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ vocabularyId }),
                },
                env
            );
            await second.text();
            expect(second.status).toBe(409);
        });

        it("DELETE linked vocabulary returns 204", async () => {
            const { cookie, orgId, lessonId, vocabularyId } = await seedLessonFixture();
            await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ vocabularyId }),
                },
                env
            );
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary/${vocabularyId}`,
                {
                    method: "DELETE",
                    headers: { Cookie: cookie },
                },
                env
            );
            expect(res.status).toBe(204);
        });

        it("DELETE unlinked vocabulary returns 404", async () => {
            const { cookie, orgId, lessonId } = await seedLessonFixture();
            const res = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary/not_linked_vocab`,
                {
                    method: "DELETE",
                    headers: { Cookie: cookie },
                },
                env
            );
            await res.text();
            expect(res.status).toBe(404);
        });

        it("PUT vocabulary reorder returns new order", async () => {
            const { cookie, orgId, lessonId, vocabularyId, vocabularyId2 } =
                await seedLessonFixture();
            const first = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ vocabularyId }),
                },
                env
            );
            expect(first.status).toBe(201);
            const second = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ vocabularyId: vocabularyId2 }),
                },
                env
            );
            expect(second.status).toBe(201);
            const reorder = await app.request(
                `http://localhost/api/v1/orgs/${orgId}/lessons/${lessonId}/vocabulary/reorder`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ orderedIds: [vocabularyId2, vocabularyId] }),
                },
                env
            );
            expect(reorder.status).toBe(200);
            const body = (await reorder.json()) as Array<{
                vocabularyId: string;
                position: number;
            }>;
            expect(body.map((r) => r.vocabularyId)).toEqual([vocabularyId2, vocabularyId]);
            expect(body.map((r) => r.position)).toEqual([1, 2]);
        });
    });
});
