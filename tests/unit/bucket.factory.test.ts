import { getBucketClient } from "@api/factories/bucket.factory";
import type { AppContext } from "@api/helpers/types.helpers";
import { BucketService } from "@api/services/bucket.service";
import { describe, expect, it } from "vitest";

describe("BucketFactory", () => {
    it("should create a BucketService instance with correct env vars", () => {
        const mockEnv = {
            CLOUDFLARE_ACCOUNT_ID: "test-account-id",
            R2_ACCESS_KEY_ID: "test-access-key",
            R2_SECRET_ACCESS_KEY: "test-secret-key",
            R2_BUCKET_NAME: "test-bucket",
            PUBLIC_CDN_URL: "https://assets.test.com",
        };

        const mockCtx = {
            env: mockEnv,
        } as unknown as AppContext;

        const bucketClient = getBucketClient(mockCtx);

        expect(bucketClient).toBeInstanceOf(BucketService);
        expect((bucketClient as any).bucketName).toBe("test-bucket");
        expect((bucketClient as any).endpoint).toBe(
            "https://test-account-id.r2.cloudflarestorage.com"
        );
        expect((bucketClient as any).publicUrl).toBe("https://assets.test.com");
    });

    it("should fallback to R2 dev endpoint if PUBLIC_CDN_URL is missing", () => {
        const mockEnv = {
            CLOUDFLARE_ACCOUNT_ID: "test-account-id",
            R2_ACCESS_KEY_ID: "test-access-key",
            R2_SECRET_ACCESS_KEY: "test-secret-key",
            R2_BUCKET_NAME: "test-bucket",
        };

        const mockCtx = {
            env: mockEnv,
        } as unknown as AppContext;

        const bucketClient = getBucketClient(mockCtx);

        expect((bucketClient as any).publicUrl).toBe(
            "https://test-account-id.r2.cloudflarestorage.com/test-bucket"
        );
    });
});
