import type { AnyColumn } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
    buildCursorPagination,
    decodeCursor,
    encodeCursor,
    processPaginatedResult,
} from "../../api/helpers/pagination.helpers";

describe("Cursor Pagination Helpers", () => {
    describe("encodeCursor & decodeCursor", () => {
        it("flawlessly encodes and decodes JSON cursors gracefully", () => {
            const payload = { primary: 1700000000, secondary: "uuid-123" };
            const encoded = encodeCursor(payload);
            const decoded = decodeCursor(encoded);

            expect(decoded).toEqual(payload);
        });

        it("gracefully bounces null on malformed base64 strings", () => {
            expect(decodeCursor("malformed_fake_b64!!===")).toBeNull();
        });
    });

    describe("buildCursorPagination AST Logic", () => {
        it("builds standard descending ordered ASTs for initial page loads (no cursor given)", () => {
            const result = buildCursorPagination(
                "table.createdAt" as unknown as AnyColumn,
                "table.id" as unknown as AnyColumn,
                undefined,
                "next"
            );

            expect(result.where).toBeUndefined(); // no bounds yet
            expect(result.orderBy).toHaveLength(2); // Should have primary/secondary descendant mapping
        });
    });

    describe("processPaginatedResult Data Orientations", () => {
        const fakeData = [
            { id: "C", score: 90 }, // Newest / Highest
            { id: "B", score: 80 },
            { id: "A", score: 70 }, // Oldest / Lowest
        ];

        it("chops excess query limits effectively returning `hasMore` signals properly (Next)", () => {
            const result = processPaginatedResult(fakeData, 2, "next", (item) => ({
                primary: item.score,
                secondary: item.id,
            }));

            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe("C");
            expect(result.nextCursor).not.toBeNull();
            expect(result.prevCursor).toBeNull(); // First page load, so null
        });

        it("reverses reversed time sequences perfectly when scrolling backward (Prev)", () => {
            const reverseFake = [
                { id: "A", score: 70 },
                { id: "B", score: 80 },
                { id: "C", score: 90 },
            ];

            // In 'prev' direction, we simulate coming from a specific point
            const result = processPaginatedResult(
                reverseFake,
                2,
                "prev",
                (item) => ({
                    primary: item.score,
                    secondary: item.id,
                }),
                "some-page-2-cursor"
            );

            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe("B");
            expect(result.items[1].id).toBe("A");

            expect(result.prevCursor).not.toBeNull(); // More items (C) in 'prev' direction
            expect(result.nextCursor).not.toBeNull(); // nextCursor should always be available to return
        });
    });
});
