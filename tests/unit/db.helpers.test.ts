import { mapCategoryToMimePattern, wrapWildcard } from "@api/helpers/db.helpers";
import { describe, expect, it } from "vitest";

describe("db.helpers", () => {
    describe("wrapWildcard", () => {
        it("should wrap non-empty search terms", () => {
            expect(wrapWildcard("test")).toBe("%test%");
            expect(wrapWildcard("  spaced  ")).toBe("%  spaced  %");
        });

        it("should return empty string for empty search", () => {
            expect(wrapWildcard("")).toBe("");
        });
    });

    describe("mapCategoryToMimePattern", () => {
        it("should map common categories to patterns", () => {
            expect(mapCategoryToMimePattern("image")).toBe("image/%");
            expect(mapCategoryToMimePattern("video")).toBe("video/%");
            expect(mapCategoryToMimePattern("audio")).toBe("audio/%");
        });

        it("should return null for 'all'", () => {
            expect(mapCategoryToMimePattern("all")).toBeNull();
        });

        it("should return null for undefined or null", () => {
            expect(mapCategoryToMimePattern(undefined)).toBeNull();
            expect(mapCategoryToMimePattern(null)).toBeNull();
        });

        it("should return null for unknown categories", () => {
            expect(mapCategoryToMimePattern("documents")).toBeNull();
            expect(mapCategoryToMimePattern("archive")).toBeNull();
        });
    });
});
