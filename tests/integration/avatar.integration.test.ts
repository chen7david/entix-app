import { describe, it, expect, beforeEach, vi } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createAuthenticatedOrg, getAuthCookie, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { parseJson } from "../lib/api-request.helper";

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
            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(true);

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
            expect(avatarBody.imageUrl).toContain("avatar.jpg");
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
            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(true);

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
    });
});
