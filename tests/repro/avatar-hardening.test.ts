import { env } from "cloudflare:test";
import app from "@api/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseJson } from "../lib/api-request.helper";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

vi.mock("@api/services/bucket.service", () => {
    return {
        BucketService: class {
            getPresignedUploadUrl = vi.fn().mockResolvedValue("https://fake-presigned-url.com");
            delete = vi.fn().mockResolvedValue(undefined);
            upload = vi.fn().mockResolvedValue({ secure_url: "https://fake-url.com" });
        },
    };
});

describe("Avatar Hardening", () => {
    let client: TestClient;
    let userId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgData } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        userId = orgData.user.id;
    });

    it("should return 409 Conflict when upload is not completed", async () => {
        const uploadRes = await client.request(`/api/v1/users/${userId}/avatar/presigned-url`, {
            method: "POST",
            body: { originalName: "avatar.jpg", contentType: "image/jpeg", fileSize: 1024 },
        });
        expect(uploadRes.status).toBe(201);
        const { uploadId } = await parseJson<any>(uploadRes);

        const patchRes = await client.request(`/api/v1/users/${userId}/avatar`, {
            method: "PATCH",
            body: { uploadId },
        });

        expect(patchRes.status).toBe(409);
        const body = await parseJson<any>(patchRes);
        expect(body.message).toBe("Upload must be completed before updating avatar");
    });

    it("should return 400 Bad Request when upload is not an image", async () => {
        const uploadRes = await client.request(`/api/v1/users/${userId}/avatar/presigned-url`, {
            method: "POST",
            body: { originalName: "malicious.pdf", contentType: "application/pdf", fileSize: 1024 },
        });
        expect(uploadRes.status).toBe(201);
        const { uploadId } = await parseJson<any>(uploadRes);

        const completeRes = await client.request(
            `/api/v1/users/${userId}/assets/${uploadId}/complete`,
            {
                method: "POST",
            }
        );
        expect(completeRes.status).toBe(200);

        const patchRes = await client.request(`/api/v1/users/${userId}/avatar`, {
            method: "PATCH",
            body: { uploadId },
        });

        expect(patchRes.status).toBe(400);
        const body = await parseJson<any>(patchRes);
        expect(body.message).toBe("Avatar upload must be an image");
    });
});
