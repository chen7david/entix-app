import { env } from "cloudflare:test";
import app from "@api/app";
import type { AppDb } from "@api/factories/db.factory";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Media Routes Integration Tests", () => {
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

    describe("GET /orgs/:organizationId/media", () => {
        it("should return paginated media when there are more than 10 items", async () => {
            const mediaItems = Array.from({ length: 15 }).map((_, i) => ({
                id: `media-${i}`,
                organizationId: orgId,
                title: `Test Media ${i}`,
                mimeType: "video/mp4",
                mediaUrl: `https://example.com/media-${i}.mp4`,
                uploadedBy: userId,
                createdAt: new Date(Date.now() - i * 10000),
                updatedAt: new Date(Date.now() - i * 10000),
            }));

            for (const item of mediaItems) {
                await db.insert(schema.media).values(item);
            }

            const res1 = await client.orgs.media.list(orgId, { limit: 10 });
            expect(res1.status).toBe(200);

            const body1 = (await res1.json()) as any;
            expect(body1.data.items).toHaveLength(10);
            expect(body1.data.nextCursor).not.toBeNull();
            expect(body1.data.prevCursor).not.toBeNull();

            expect(body1.data.items[0].id).toBe("media-0");
            expect(body1.data.items[9].id).toBe("media-9");

            const res2 = await client.orgs.media.list(orgId, {
                limit: 10,
                cursor: body1.data.nextCursor,
                direction: "next",
            });
            expect(res2.status).toBe(200);

            const body2 = (await res2.json()) as any;
            expect(body2.data.items).toHaveLength(5);
            expect(body2.data.nextCursor).toBeNull(); // No more items successfully intercepted implicitly
            expect(body2.data.items[0].id).toBe("media-10");
            expect(body2.data.items[4].id).toBe("media-14");
        });
    });
});
