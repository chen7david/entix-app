import { env } from "cloudflare:test";
import app from "@api/app";
import type { AppDb } from "@api/factories/db.factory";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Playlist Routes Integration Tests", () => {
    let client: TestClient;
    let orgId: string;
    let userId: string;
    let db: AppDb;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id, orgData } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
        userId = orgData.data.user.id;
        db = getDbClient({ env } as any);
    });

    describe("GET /orgs/:organizationId/playlists", () => {
        it("should return the new paginated response shape { items, nextCursor, prevCursor }", async () => {
            const playlist = {
                id: "playlist-1",
                organizationId: orgId,
                title: "Test Playlist",
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await db.insert(schema.playlists).values(playlist);

            const res = await client.orgs.playlists.list(orgId, { limit: 10 });
            expect(res.status).toBe(200);

            const body = (await res.json()) as any;
            expect(body.items).toBeDefined();
            expect(body.items).toHaveLength(1);
            expect(body.nextCursor).toBeNull(); // Only 1 item seeded, so no next page
            expect(body.prevCursor).toBeNull(); // First page load, so no previous page
            expect(body.items[0].title).toBe("Test Playlist");
        });

        it("should correctly paginate with limit=1 and nextCursor", async () => {
            const playlists = [
                {
                    id: "p1",
                    organizationId: orgId,
                    title: "First Playlist",
                    createdBy: userId,
                    createdAt: new Date(Date.now() - 1000),
                    updatedAt: new Date(Date.now() - 1000),
                },
                {
                    id: "p2",
                    organizationId: orgId,
                    title: "Second Playlist",
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            for (const p of playlists) {
                await db.insert(schema.playlists).values(p);
            }

            // Get first page
            const res1 = await client.orgs.playlists.list(orgId, { limit: 1 });
            const body1 = (await res1.json()) as any;

            expect(body1.items).toHaveLength(1);
            expect(body1.nextCursor).not.toBeNull();
            expect(body1.prevCursor).toBeNull();

            // Second page must contain the other playlist
            const res2 = await client.orgs.playlists.list(orgId, {
                limit: 1,
                cursor: body1.nextCursor,
            });
            const body2 = (await res2.json()) as any;

            expect(body2.items).toHaveLength(1);
            expect(body2.items[0].id).not.toBe(body1.items[0].id);
            expect(body2.nextCursor).toBeNull();
            expect(body2.prevCursor).not.toBeNull();
        });

        it("should correctly filter using a substring search", async () => {
            const playlists = [
                {
                    id: "target-1",
                    organizationId: orgId,
                    title: "Test Playlist Alpha",
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: "target-2",
                    organizationId: orgId,
                    title: "Ignored Result",
                    createdBy: userId,
                    createdAt: new Date(Date.now() - 1000),
                    updatedAt: new Date(Date.now() - 1000),
                },
            ];

            for (const p of playlists) {
                await db.insert(schema.playlists).values(p);
            }

            const res = await client.orgs.playlists.list(orgId, { search: "Alpha" });
            const body = (await res.json()) as any;

            expect(body.items).toHaveLength(1);
            expect(body.items[0].title).toBe("Test Playlist Alpha");
        });
    });

    describe("GET /orgs/:organizationId/playlists/:playlistId/sequence", () => {
        it("should return enriched sequence with media details", async () => {
            // Seed a playlist
            const playlistId = "test-playlist";
            await db.insert(schema.playlists).values({
                id: playlistId,
                organizationId: orgId,
                title: "Sequence Test",
                createdBy: userId,
            });

            // Seed some media
            const mediaId = "test-media";
            await db.insert(schema.media).values({
                id: mediaId,
                organizationId: orgId,
                title: "Test Media",
                mimeType: "video/mp4",
                mediaUrl: "http://example.com/video.mp4",
                uploadedBy: userId,
            });

            // Set sequence
            await db.insert(schema.playlistMedia).values({
                playlistId,
                mediaId,
                position: 0,
            });

            // Fetch sequence
            const res = await client.orgs.playlists.getSequence(orgId, playlistId);
            expect(res.status).toBe(200);

            const body = (await res.json()) as any[];
            expect(body).toHaveLength(1);
            expect(body[0].mediaId).toBe(mediaId);
            expect(body[0].media).toBeDefined();
            expect(body[0].media.title).toBe("Test Media");
        });
    });
});
