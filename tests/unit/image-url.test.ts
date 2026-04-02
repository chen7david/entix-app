import { getAssetUrl, getAvatarUrl, getImageUrl } from "@shared/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("image-url utilities", () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
    });

    it("builds raw asset url from absolute base domain", () => {
        const url = getAssetUrl("https://cdn.entix.org/orgId/file.png");
        expect(url).toBe("https://cdn.entix.org/orgId/file.png");
    });

    it("builds Cloudflare transformation URL when enabled", () => {
        const url = getImageUrl(
            "https://cdn.entix.org/orgId/file.png",
            { width: 100, height: 100 },
            true
        );
        expect(url).toBe("https://cdn.entix.org/cdn-cgi/image/width=100,height=100/orgId/file.png");
    });

    it("uses avatar presets and applies transformations when env var is set", () => {
        vi.stubEnv("VITE_ENABLE_CF_IMAGES", "true");

        const smallAvatar = getAvatarUrl("https://cdn.entix.org/orgId/file.png", "sm");
        expect(smallAvatar).toBe(
            "https://cdn.entix.org/cdn-cgi/image/width=40,height=40,fit=cover/orgId/file.png"
        );

        const largeAvatar = getAvatarUrl("https://cdn.entix.org/orgId/file.png", "lg");
        expect(largeAvatar).toBe(
            "https://cdn.entix.org/cdn-cgi/image/width=200,height=200,fit=cover/orgId/file.png"
        );
    });

    it("falls back to raw URL if VITE_ENABLE_CF_IMAGES is false or empty", () => {
        vi.stubEnv("VITE_ENABLE_CF_IMAGES", "false");
        const smallAvatar = getAvatarUrl("https://cdn.entix.org/orgId/file.png", "sm");
        expect(smallAvatar).toBe("https://cdn.entix.org/orgId/file.png");
    });
});
