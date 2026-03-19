import { describe, it, expect, beforeEach, vi } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createAuthenticatedOrg, getAuthCookie, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { parseJson } from "../lib/api-request.helper";
import { drizzle } from "drizzle-orm/d1";
import { member as memberTable } from "@shared/db/schema.db";
import { createMockMember } from "../factories/member.factory";

describe("Avatar Integration", () => {
    beforeEach(async () => {
        await createTestDb();
    });

    describe("Authentication and Authorization", () => {
        it("returns 401 if no session cookie", async () => {
            const client = createTestClient(app, env);
            const res = await client.request("/api/v1/orgs/some-org/members/some-user/avatar", {
                method: "PATCH",
                body: { uploadId: "test" },
            });
            expect(res.status).toBe(401);
        });

        it("returns 403 for a user not in the organization", async () => {
            const regularCookie = await getAuthCookie({
                app,
                env,
                user: {
                    email: `outsider.${Date.now()}@example.com`,
                    password: "Password123!",
                    name: "Outsider User",
                },
            });
            const client = createTestClient(app, env, regularCookie);
            const res = await client.request("/api/v1/orgs/some-org/members/some-user/avatar", {
                method: "PATCH",
                body: { uploadId: "test" },
            });
            expect(res.status).toBe(403);
        });
    });

    describe("Update Avatar", () => {
        it("allows a member to update their own avatar", async () => {
            const { orgId } = await createAuthenticatedOrg({ app, env });
            const { cookie, userId: memberUserId } = await createOrgMemberWithRole({
                app,
                env,
                orgId,
                role: "member",
                email: `member.${Date.now()}@example.com`,
            });

            const client = createTestClient(app, env, cookie);

            // Mock BucketService
            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue("https://fake-presigned-url.com");
            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(undefined);

            // 1. Create an upload
            const uploadRes = await client.request(`/api/v1/orgs/${orgId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "avatar.jpg",
                    contentType: "image/jpeg",
                    fileSize: 50000,
                },
            });
            expect(uploadRes.status).toBe(201);
            const { uploadId } = await parseJson<any>(uploadRes);

            // 2. Complete the upload
            const completeRes = await client.request(`/api/v1/orgs/${orgId}/uploads/${uploadId}/complete`, {
                method: "POST",
            });
            expect(completeRes.status).toBe(200);

            // 3. Set as avatar
            const avatarRes = await client.request(`/api/v1/orgs/${orgId}/members/${memberUserId}/avatar`, {
                method: "PATCH",
                body: { uploadId },
            });
            expect(avatarRes.status).toBe(200);
            const avatarBody = await parseJson<any>(avatarRes);
            expect(avatarBody.imageUrl).toBeDefined();
            expect(avatarBody.imageUrl).toMatch(/\.jpg$/);
        });

        it("returns 404 for a non-existent upload", async () => {
            const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
            const client = createTestClient(app, env, cookie);

            // Get user ID from the org creator
            const membersData = await client.request(`/api/v1/orgs/${orgId}/uploads`);
            expect(membersData.status).toBe(200);

            const avatarRes = await client.request(`/api/v1/orgs/${orgId}/members/nonexistent-user/avatar`, {
                method: "PATCH",
                body: { uploadId: "nonexistent-upload" },
            });
            // Should be 404 (member not found)
            expect(avatarRes.status).toBe(404);
        });
    });

    describe("Remove Avatar", () => {
        it("allows a member to remove their own avatar", async () => {
            const { orgId } = await createAuthenticatedOrg({ app, env });
            const { cookie, userId: memberUserId } = await createOrgMemberWithRole({
                app,
                env,
                orgId,
                role: "member",
                email: `member.${Date.now()}@example.com`,
            });

            const client = createTestClient(app, env, cookie);

            // Mock BucketService
            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue("https://fake-presigned-url.com");
            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(undefined);

            // 1. Create and complete an upload
            const uploadRes = await client.request(`/api/v1/orgs/${orgId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "avatar.png",
                    contentType: "image/png",
                    fileSize: 30000,
                },
            });
            const { uploadId } = await parseJson<any>(uploadRes);
            await client.request(`/api/v1/orgs/${orgId}/uploads/${uploadId}/complete`, { method: "POST" });

            // 2. Set as avatar
            await client.request(`/api/v1/orgs/${orgId}/members/${memberUserId}/avatar`, {
                method: "PATCH",
                body: { uploadId },
            });

            // 3. Remove avatar
            const removeRes = await client.request(`/api/v1/orgs/${orgId}/members/${memberUserId}/avatar`, {
                method: "DELETE",
            });
            expect(removeRes.status).toBe(204);
        });

        it("returns 404 when no avatar to remove", async () => {
            const { orgId } = await createAuthenticatedOrg({ app, env });
            const { cookie, userId: memberUserId } = await createOrgMemberWithRole({
                app,
                env,
                orgId,
                role: "member",
                email: `member.${Date.now()}@example.com`,
            });

            const client = createTestClient(app, env, cookie);

            const removeRes = await client.request(`/api/v1/orgs/${orgId}/members/${memberUserId}/avatar`, {
                method: "DELETE",
            });
            expect(removeRes.status).toBe(404);
        });
        it("does not delete an avatar from R2 if removed by an admin in a different org", async () => {
            // Setup Org A and Org B
            const { orgId: orgAId } = await createAuthenticatedOrg({ app, env });
            const { orgId: orgBId, cookie: orgBCookie } = await createAuthenticatedOrg({ app, env });
            
            const userEmail = `crossorg.${Date.now()}@test.com`;

            // User A is added to Org A
            const { cookie: cookieA, userId: userIdA } = await createOrgMemberWithRole({
                app, env, orgId: orgAId, role: "member", email: userEmail
            });
            
            // User A is also added to Org B via direct DB insert to bypass duplicate sign-up rejection
            const db = drizzle(env.DB);
            await db.insert(memberTable).values(createMockMember({
                organizationId: orgBId,
                userId: userIdA,
                role: "member",
            }));

            // Mock BucketService
            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue("https://fake-presigned-url.com");
            const deleteSpy = vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(undefined);

            const clientA = createTestClient(app, env, cookieA);
            const clientBAdmin = createTestClient(app, env, orgBCookie); // Org B Owner/Admin

            // 1. User A uploads avatar in Org A
            const uploadRes = await clientA.request(`/api/v1/orgs/${orgAId}/uploads`, {
                method: "POST",
                body: { originalName: "avatar.png", contentType: "image/png", fileSize: 30000 },
            });
            const { uploadId } = await parseJson<any>(uploadRes);
            await clientA.request(`/api/v1/orgs/${orgAId}/uploads/${uploadId}/complete`, { method: "POST" });

            // 2. User A sets it as avatar in Org A
            await clientA.request(`/api/v1/orgs/${orgAId}/members/${userIdA}/avatar`, {
                method: "PATCH",
                body: { uploadId },
            });

            deleteSpy.mockClear();

            // 3. Admin of Org B removes User A's avatar
            const removeRes = await clientBAdmin.request(`/api/v1/orgs/${orgBId}/members/${userIdA}/avatar`, {
                method: "DELETE",
            });
            expect(removeRes.status).toBe(204);

            // 4. Assert BucketService.delete was NOT called because Admin B is not the owner and upload belongs to Org A
            expect(deleteSpy).not.toHaveBeenCalled();
        });
    });
});
