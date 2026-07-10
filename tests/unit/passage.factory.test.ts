import { getPassageService } from "@api/factories/passage.factory";
import type { AppContext } from "@api/helpers/types.helpers";
import { PassageService } from "@api/services/passages/passage.service";
import { describe, expect, it } from "vitest";

function buildMockCtx(overrides: { PUBLIC_CDN_URL?: string } = {}): AppContext {
    const publicCdnUrl =
        "PUBLIC_CDN_URL" in overrides
            ? overrides.PUBLIC_CDN_URL
            : "https://development-cdn.entix.org";

    return {
        env: {
            CLOUDFLARE_ACCOUNT_ID: "test-account",
            R2_BUCKET_NAME: "test-bucket",
            R2_ACCESS_KEY_ID: "key",
            R2_SECRET_ACCESS_KEY: "secret",
            PUBLIC_CDN_URL: publicCdnUrl,
            DB: {} as D1Database,
        },
    } as unknown as AppContext;
}

describe("passage.factory", () => {
    it("getPassageService throws if PUBLIC_CDN_URL is not set", () => {
        const ctx = buildMockCtx({ PUBLIC_CDN_URL: undefined });
        expect(() => getPassageService(ctx)).toThrow(
            "[passage.factory] PUBLIC_CDN_URL env var is required"
        );
    });

    it("getPassageService returns PassageService when PUBLIC_CDN_URL is set", () => {
        const ctx = buildMockCtx();
        expect(getPassageService(ctx)).toBeInstanceOf(PassageService);
    });
});
