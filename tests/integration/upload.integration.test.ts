import { env } from "cloudflare:test";
import app from "@api/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseJson } from "../lib/api-request.helper";
import {
    createAuthenticatedOrg,
    createOrgMemberWithRole,
    getAuthCookie,
} from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Uploads Integration", () => {
    beforeEach(async () => {
        await createTestDb();
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
                role: "admin",
                email: `admin.${Date.now()}@example.com`,
            });
            const organizationId = orgId;

            const client = createTestClient(app, env, cookie);

            const { BucketService } = await import("@api/services/bucket.service");
            const presignSpy = vi
                .spyOn(BucketService.prototype, "getPresignedUploadUrl")
                .mockResolvedValue("https://fake-presigned-url.com");
            const deleteSpy = vi
                .spyOn(BucketService.prototype, "delete")
                .mockResolvedValue(undefined);

            const reqRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "test-video.mp4",
                    contentType: "video/mp4",
                    fileSize: 1024 * 1024 * 5, // 5MB
                },
            });

            expect(reqRes.status).toBe(201);
            const reqBody = await parseJson<any>(reqRes);
            expect(reqBody.presignedUrl).toBe("https://fake-presigned-url.com");
            expect(reqBody.uploadId).toBeDefined();

            const uploadId = reqBody.uploadId;

            const completeRes = await client.request(
                `/api/v1/orgs/${organizationId}/uploads/${uploadId}/complete`,
                {
                    method: "POST",
                }
            );
            expect(completeRes.status).toBe(200);
            const completeBody = await parseJson<any>(completeRes);
            expect(completeBody.status).toBe("completed");

            const listRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`);
            expect(listRes.status).toBe(200);
            const listBody = await parseJson<any>(listRes);
            expect(listBody.items.length).toBe(1);
            expect(listBody.items[0].id).toBe(uploadId);
            expect(listBody.items[0].status).toBe("completed");
            expect(listBody.items[0].originalName).toBe("test-video.mp4");

            const deleteRes = await client.request(
                `/api/v1/orgs/${organizationId}/uploads/${uploadId}`,
                {
                    method: "DELETE",
                }
            );
            expect(deleteRes.status).toBe(204);

            presignSpy.mockRestore();
            deleteSpy.mockRestore();
        });

        it("allows an admin to delete an upload (Success)", async () => {
            const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
            const organizationId = orgId;

            const client = createTestClient(app, env, cookie);

            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue(
                "https://fake.presigned"
            );
            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(undefined); // Success return for new implementation

            const reqRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "test-success.png",
                    contentType: "image/png",
                    fileSize: 1024,
                },
            });
            const { uploadId } = await parseJson<any>(reqRes);

            const deleteRes = await client.request(
                `/api/v1/orgs/${organizationId}/uploads/${uploadId}`,
                {
                    method: "DELETE",
                }
            );
            expect(deleteRes.status).toBe(204);

            const listRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`);
            const listBody = await parseJson<any>(listRes);
            expect(listBody.items.length).toBe(0);
        });

        it("cleans up DB even if file is missing from R2 (Ghost Object / 404)", async () => {
            const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
            const organizationId = orgId;
            const client = createTestClient(app, env, cookie);

            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue(
                "https://fake.presigned"
            );

            vi.spyOn(BucketService.prototype, "delete").mockResolvedValue(undefined as any);

            const reqRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "ghost-file.png",
                    contentType: "image/png",
                    fileSize: 1024,
                },
            });
            const { uploadId } = await parseJson<any>(reqRes);

            const deleteRes = await client.request(
                `/api/v1/orgs/${organizationId}/uploads/${uploadId}`,
                {
                    method: "DELETE",
                }
            );
            expect(deleteRes.status).toBe(204);

            const listRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`);
            const listBody = await parseJson<any>(listRes);
            expect(listBody.items.length).toBe(0);
        });

        it("aborts DB deletion and throws if R2 returns a critical error (Failure / 500)", async () => {
            const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
            const organizationId = orgId;
            const client = createTestClient(app, env, cookie);

            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue(
                "https://fake.presigned"
            );

            vi.spyOn(BucketService.prototype, "delete").mockImplementation(() => {
                const error: any = new Error("R2 Delete Error: Internal Server Error");
                error.status = 500;
                throw error;
            });

            const reqRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`, {
                method: "POST",
                body: {
                    originalName: "failing-delete.png",
                    contentType: "image/png",
                    fileSize: 1024,
                },
            });
            const { uploadId } = await parseJson<any>(reqRes);

            const deleteRes = await client.request(
                `/api/v1/orgs/${organizationId}/uploads/${uploadId}`,
                {
                    method: "DELETE",
                }
            );
            expect(deleteRes.status).toBe(500);

            const listRes = await client.request(`/api/v1/orgs/${organizationId}/uploads`);
            const listBody = await parseJson<any>(listRes);
            expect(listBody.items.length).toBe(1);
            expect(listBody.items[0].id).toBe(uploadId);
        });
        it("correctly paginates uploads with limit=1 and nextCursor", async () => {
            const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
            const organizationId = orgId;
            const client = createTestClient(app, env, cookie);

            const { BucketService } = await import("@api/services/bucket.service");
            vi.spyOn(BucketService.prototype, "getPresignedUploadUrl").mockResolvedValue(
                "https://fake.presigned"
            );

            // Create 2 uploads
            for (let i = 0; i < 2; i++) {
                await client.request(`/api/v1/orgs/${organizationId}/uploads`, {
                    method: "POST",
                    body: {
                        originalName: `test-${i}.png`,
                        contentType: "image/png",
                        fileSize: 1024,
                    },
                });
            }

            // Get first page
            const res1 = await client.request(`/api/v1/orgs/${organizationId}/uploads?limit=1`);
            const body1 = await parseJson<any>(res1);

            expect(body1.items).toHaveLength(1);
            expect(body1.nextCursor).not.toBeNull();
            expect(body1.prevCursor).toBeNull();

            // Get second page
            const res2 = await client.request(
                `/api/v1/orgs/${organizationId}/uploads?limit=1&cursor=${body1.nextCursor}`
            );
            const body2 = await parseJson<any>(res2);

            expect(body2.items).toHaveLength(1);
            expect(body2.items[0].id).not.toBe(body1.items[0].id);
            expect(body2.nextCursor).toBeNull();
            expect(body2.prevCursor).not.toBeNull();
        });
    });
});
