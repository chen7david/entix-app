import { describe, it, expect, beforeEach, vi } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { getAuthCookie, createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { parseJson } from "../lib/api-request.helper";

describe("Uploads Integration", () => {
    beforeEach(async () => {
        await createTestDb();
    });

    describe("Authentication and Authorization", () => {
        it("returns 401 Unauthorized if no session cookie", async () => {
            const client = createTestClient(app, env);
            const res = await client.request("/api/v1/orgs/some-org/uploads");
            expect(res.status).toBe(401);
        });

        it("returns 403 Forbidden for a user not in the organization", async () => {
            const regularCookie = await getAuthCookie({
                app,
                env,
                user: {
                    email: `regular.${Date.now()}@example.com`,
                    password: "Password123!",
                    name: "Regular User",
                },
            });
            const client = createTestClient(app, env, regularCookie);
            const res = await client.request("/api/v1/orgs/some-org/uploads");
            expect(res.status).toBe(403);
        });
    });

    describe("Upload Endpoints", () => {
        it("allows an organization member to request a presigned URL, complete it, and list it", async () => {
            const { orgId } = await createAuthenticatedOrg({ app, env });
            const { cookie } = await createOrgMemberWithRole({
                app,
                env,
                orgId,
                role: "member",
                email: `member.${Date.now()}@example.com`
            });
            const organizationId = orgId;

            const client = createTestClient(app, env, cookie);

            // Mock BucketService
            const { BucketService } = await import("@api/services/bucket.service");
            const presignSpy = vi.spyOn(BucketService.prototype, 'getPresignedUploadUrl').mockResolvedValue("https://fake-presigned-url.com");
            const deleteSpy = vi.spyOn(BucketService.prototype, 'delete').mockResolvedValue(true);

            // 1. Request Presigned URL
            const reqRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "test-video.mp4",
                    contentType: "video/mp4",
                    fileSize: 1024 * 1024 * 5 // 5MB
                }
            });

            expect(reqRes.status).toBe(201);
            const reqBody = await parseJson<any>(reqRes);
            expect(reqBody.presignedUrl).toBe("https://fake-presigned-url.com");
            expect(reqBody.uploadId).toBeDefined();

            const uploadId = reqBody.uploadId;

            // 2. Complete Upload
            const completeRes = await client.request(`/api/v1/orgs/${organizationId}/uploads/${uploadId}/complete`, {
                method: "POST"
            });
            expect(completeRes.status).toBe(200);
            const completeBody = await parseJson<any>(completeRes);
            expect(completeBody.status).toBe("completed");

            // 3. List Uploads
            const listRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`);
            expect(listRes.status).toBe(200);
            const listBody = await parseJson<any[]>(listRes);
            expect(listBody.length).toBe(1);
            expect(listBody[0].id).toBe(uploadId);
            expect(listBody[0].status).toBe("completed");
            expect(listBody[0].originalName).toBe("test-video.mp4");

            // 4. Try to delete as member (should fail because members don't have upload:delete)
            const deleteFailRes = await client.request(`/api/v1/orgs/${organizationId}/uploads/${uploadId}`, {
                method: "DELETE"
            });
            expect(deleteFailRes.status).toBe(403);

            presignSpy.mockRestore();
            deleteSpy.mockRestore();
        });

        it("allows an admin to delete an upload", async () => {
            const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
            const organizationId = orgId;

            const client = createTestClient(app, env, cookie);

            // Mock BucketService
            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, 'getPresignedUploadUrl').mockResolvedValue("https://fake.presigned");
            vi.spyOn(BucketService.prototype, 'delete').mockResolvedValue(true);

            // 1. Create upload
            const reqRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "test-image.png",
                    contentType: "image/png",
                    fileSize: 1024
                }
            });
            const { uploadId } = await parseJson<any>(reqRes);

            // 2. Delete upload
            const deleteRes = await client.request(`/api/v1/orgs/${organizationId}/uploads/${uploadId}`, {
                method: "DELETE"
            });
            expect(deleteRes.status).toBe(204);

            // 3. Verify it's gone
            const listRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`);
            const listBody = await parseJson<any[]>(listRes);
            expect(listBody.length).toBe(0);
        });
    });
});
