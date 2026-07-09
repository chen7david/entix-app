import { mapTextCollection } from "@api/helpers/text-collection.helpers";
import { describe, expect, it } from "vitest";

describe("mapTextCollection", () => {
    it("serializes dates as epoch milliseconds", () => {
        const createdAt = new Date("2024-01-01T00:00:00.000Z");
        const updatedAt = new Date("2024-06-01T00:00:00.000Z");

        const result = mapTextCollection({
            id: "col_1",
            organizationId: "org_1",
            title: "Collection",
            author: "Author",
            description: "Desc",
            type: "book",
            cefrLevel: "B1",
            bucketKey: "key",
            r2Url: "https://cdn.example.com/col",
            totalPages: 10,
            createdAt,
            updatedAt,
        } as any);

        expect(result.createdAt).toBe(createdAt.getTime());
        expect(result.updatedAt).toBe(updatedAt.getTime());
        expect(result.title).toBe("Collection");
    });
});
