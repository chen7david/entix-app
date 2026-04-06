import { env } from "cloudflare:test";
import app from "@api/app";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Playlist Detail Integration Tests", () => {
    let client: TestClient;
    let orgId: string;
    let userId: string;
    let db: any;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id, orgData } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
        userId = orgData.data.user.id;
        db = getDbClient({ env } as any);
    });

    it("GET /orgs/:organizationId/playlists/:playlistId > should return a playlist by ID", async () => {
        const playlistId = "test-playlist-id";
        await db.insert(schema.playlists).values({
            id: playlistId,
            organizationId: orgId,
            title: "Test Playlist",
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const res = await client.orgs.playlists.get(orgId, playlistId);

        expect(res.status).toBe(200);
        const result = (await res.json()) as any;
        expect(result.id).toBe(playlistId);
        expect(result.title).toBe("Test Playlist");
    });

    it("GET /orgs/:organizationId/playlists/:playlistId > should return 404 for non-existent playlist", async () => {
        const res = await client.orgs.playlists.get(orgId, "non-existent-id");

        expect(res.status).toBe(404);
    });

    it("GET /orgs/:organizationId/playlists/:playlistId > should return 404 when playlist belongs to another org", async () => {
        // Create another org and its playlist
        const { orgId: otherOrgId, orgData: otherOrgData } = await createAuthenticatedOrg({
            app,
            env,
        });
        const otherPlaylistId = "other-playlist-id";
        await db.insert(schema.playlists).values({
            id: otherPlaylistId,
            organizationId: otherOrgId,
            title: "Other Org Playlist",
            createdBy: otherOrgData.data.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Current client (orgId) tries to access otherPlaylistId
        const res = await client.orgs.playlists.get(orgId, otherPlaylistId);

        // Should be 404 because findPlaylistById(id, orgId) will return null
        expect(res.status).toBe(404);
    });
});
