import { env } from "cloudflare:test";
import app from "@api/app";
import * as schema from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseJson } from "../lib/api-request.helper";
import { getAuthCookie } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Avatar Integration", () => {
    beforeEach(async () => {
        await createTestDb();
    });

    describe("Authentication and Authorization", () => {
        it("returns 401 if no session cookie", async () => {
            const client = createTestClient(app, env);
            const res = await client.request("/api/v1/users/some-user/avatar", {
                method: "PATCH",
                body: { uploadId: "test" },
            });
            expect(res.status).toBe(401);
        });

        it("returns 403 for a user attempting to manage someone else's avatar", async () => {
            const regularCookie = await getAuthCookie({
                app,
                env,
                user: {
                    email: `outsider.${Date.now()}@example.com`,
                    password: "Password123!",
                    name: "Outsider AuthUser",
                },
            });
            const client = createTestClient(app, env, regularCookie);
            const res = await client.request("/api/v1/users/some-other-user/avatar", {
                method: "PATCH",
                body: { uploadId: "test" },
            });
            expect(res.status).toBe(403);
        });
    });

    describe("Update Avatar", () => {
        it("allows a user to update their own avatar independently of any organization", async () => {
            const email = `global.user.${Date.now()}@example.com`;
            const cookie = await getAuthCookie({
                app,
                env,
                user: {
                    email,
                    password: "Password123!",
                    name: "Global User",
                },
            });

            const db = drizzle(env.DB, { schema });
            const user = await db.query.authUsers.findFirst({
                where: (u, { eq }) => eq(u.email, email),
            });
            const memberUserId = user?.id;

            const client = createTestClient(app, env, cookie);

            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue(
                "https://fake-presigned-url.com"
            );
            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(undefined);

            const uploadRes = await client.request(
                `/api/v1/users/${memberUserId}/avatar/presigned-url`,
                {
                    method: "POST",
                    body: {
                        originalName: "avatar.jpg",
                        contentType: "image/jpeg",
                        fileSize: 50000,
                    },
                }
            );
            expect(uploadRes.status).toBe(201);
            const { uploadId } = await parseJson<any>(uploadRes);

            const completeRes = await client.request(
                `/api/v1/users/${memberUserId}/assets/${uploadId}/complete`,
                {
                    method: "POST",
                }
            );
            expect(completeRes.status).toBe(200);

            const avatarRes = await client.request(`/api/v1/users/${memberUserId}/avatar`, {
                method: "PATCH",
                body: { uploadId },
            });
            expect(avatarRes.status).toBe(200);
            const avatarBody = await parseJson<any>(avatarRes);
            expect(avatarBody.imageUrl).toBeDefined();
            expect(avatarBody.imageUrl).toMatch(/\.jpg$/);
        });
    });

    describe("Remove Avatar", () => {
        it("allows a user to remove their own avatar", async () => {
            const email = `remover.${Date.now()}@example.com`;
            const cookie = await getAuthCookie({
                app,
                env,
                user: {
                    email,
                    password: "Password123!",
                    name: "Remover",
                },
            });
            const db = drizzle(env.DB, { schema });
            const user = await db.query.authUsers.findFirst({
                where: (u, { eq }) => eq(u.email, email),
            });
            const memberUserId = user?.id;

            const client = createTestClient(app, env, cookie);

            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue(
                "https://fake-presigned-url.com"
            );
            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(undefined);

            const uploadRes = await client.request(
                `/api/v1/users/${memberUserId}/avatar/presigned-url`,
                {
                    method: "POST",
                    body: { originalName: "avatar.png", contentType: "image/png", fileSize: 30000 },
                }
            );
            const { uploadId } = await parseJson<any>(uploadRes);
            await client.request(`/api/v1/users/${memberUserId}/assets/${uploadId}/complete`, {
                method: "POST",
            });

            await client.request(`/api/v1/users/${memberUserId}/avatar`, {
                method: "PATCH",
                body: { uploadId },
            });

            const removeRes = await client.request(`/api/v1/users/${memberUserId}/avatar`, {
                method: "DELETE",
            });
            expect(removeRes.status).toBe(204);
        });
    });
});
