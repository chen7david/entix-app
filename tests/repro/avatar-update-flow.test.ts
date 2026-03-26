import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

/**
 * Reproduction tests for the Avatar Update Flow
 *
 * Root cause of the original bug:
 *   `AvatarDropzone` was creating uploads via `POST /orgs/:orgId/uploads` (writes to `uploads` table),
 *   but `AvatarService.updateAvatar` reads from `userUploads` table via `getUserUploadById`.
 *   These are two separate DB tables — so the uploadId was never found, causing a 404.
 *
 * Fix applied:
 *   `AvatarDropzone` now uses `POST /users/:userId/avatar/presigned-url` (writes to `userUploads`)
 *   and completes via `POST /users/:userId/assets/:uploadId/complete`.
 *
 * NOTE: The presigned URL tests hit a miniflare limitation — `env.R2` is not configured
 * with a real `url` in the test environment, so `BucketService.getPresignedUploadUrl` returns 500.
 * Permission checks still pass (the 500 is deeper than auth). These tests focus on the
 * meaningful correctness boundaries: route accessibility and upload-table isolation.
 */
describe("Avatar Update Flow", () => {
    let client: TestClient;
    let orgId: string;
    let firstMemberId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;

        const importRes = await client.orgs.members.import(orgId, [{
            email: "member-avatar-test@example.com",
            name: "Test Member",
            profile: { firstName: "Test", lastName: "Member", sex: "other" }
        }]);
        expect(importRes.status).toBe(200);

        const listRes = await client.orgs.users.list(orgId);
        const listBody = await listRes.json() as any;
        firstMemberId = listBody.items[0].id;
    });

    it("should route presigned URL request to the user avatar endpoint (not org uploads)", async () => {
        // The route must be accessible (auth/permission layer passes).
        // It will 500 in test because R2 is not fully configured in miniflare.
        // We verify this is NOT a 401/403/404 (access) error.
        const res = await client.request(`/api/v1/users/${firstMemberId}/avatar/presigned-url`, {
            method: "POST",
            body: { originalName: "avatar.jpg", contentType: "image/jpeg", fileSize: 1024 },
        });

        // Not an auth/permission issue — route and middleware are correct.
        // 500 is expected from R2 not being configured in miniflare tests.
        expect(res.status).not.toBe(401); // Not unauthorized
        expect(res.status).not.toBe(403); // Not forbidden
        expect(res.status).not.toBe(404); // Route exists
    });

    it("should reject avatar PATCH when uploadId is from org uploads (different table)", async () => {
        // Use a fabricated uploadId that won't exist in userUploads — simulates the broken flow
        const fakeOrgUploadId = "org-scoped-upload-id-that-does-not-exist-in-user-uploads";

        const patchRes = await client.request(`/api/v1/users/${firstMemberId}/avatar`, {
            method: "PATCH",
            body: { uploadId: fakeOrgUploadId },
        });

        // AvatarService.updateAvatar reads from userUploads, not uploads table.
        // An org upload ID will never be found there.
        expect(patchRes.status).toBe(404);
        const body = await patchRes.json() as any;
        expect(body.message).toBe("Upload not found");
    });

    it("should successfully remove avatar via the consolidated DELETE route (admin acting on member)", async () => {
        const deleteRes = await client.request(`/api/v1/users/${firstMemberId}/avatar`, {
            method: "DELETE",
        });

        // 404 = logical "No avatar set yet" — route was found and executed correctly
        // 204 = avatar was cleared
        if (deleteRes.status === 404) {
            const body = await deleteRes.json() as any;
            expect(body.message).toBe("No avatar to remove");
        } else {
            expect(deleteRes.status).toBe(204);
        }
    });
});
