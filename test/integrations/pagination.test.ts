import { describe, it, expect } from 'vitest';
import { 
    encodeCursor, 
    decodeCursor, 
    buildCursorPagination, 
    processPaginatedResult 
} from '../../api/helpers/pagination.helpers';

describe('Cursor Pagination Helpers', () => {

    describe('encodeCursor & decodeCursor', () => {
        it('flawlessly encodes and decodes JSON cursors gracefully', () => {
            const payload = { primary: 1700000000, secondary: "uuid-123" };
            const encoded = encodeCursor(payload);
            const decoded = decodeCursor(encoded);

            expect(decoded).toEqual(payload);
        });

        it('gracefully bounces null on malformed base64 strings', () => {
            expect(decodeCursor("malformed_fake_b64!!===")).toBeNull();
        });
    });

    describe('buildCursorPagination AST Logic', () => {
        it('builds standard descending ordered ASTs for initial page loads (no cursor given)', () => {
            const result = buildCursorPagination("table.createdAt", "table.id", undefined, "next");
            
            expect(result.where).toBeUndefined(); // no bounds yet
            expect(result.orderBy).toHaveLength(2); // Should have primary/secondary descendant mapping
            // Note: AST nodes are complex Symbol-based structures, we verify structural assignments.
        });
    });

    describe('processPaginatedResult Data Orientations', () => {
        const fakeData = [
            { id: "C", score: 90 }, // Newest / Highest
            { id: "B", score: 80 },
            { id: "A", score: 70 }, // Oldest / Lowest
        ];

        it('chops excess query limits effectively returning `hasMore` signals properly (Next)', () => {
            // Suppose limit = 2. Drizzle fetches + 1 = 3 items to check if there is more.
            const result = processPaginatedResult(
                fakeData, 
                2, 
                "next", 
                (item) => ({ primary: item.score, secondary: item.id })
            );

            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe("C");
             // "B" becomes the tail end marker for the NEXT page.
             // "C" is securely marked as the PREV cursor to go back upwards.
            expect(result.nextCursor).not.toBeNull();
            expect(result.prevCursor).not.toBeNull();

            // Next time we query 'next', we would ask for items OLDER than B.
        });

        it('reverses reversed time sequences perfectly when scrolling backward (Prev)', () => {
            // When querying 'prev', the database order outputs ASC. (A, B, C)
            const reverseFake = [
                { id: "A", score: 70 },
                { id: "B", score: 80 },
                { id: "C", score: 90 },
            ];
            
            // Limit 2. Drizzle fetched 3 meaning hasMore = true going BACKWARDS.
            const result = processPaginatedResult(
                reverseFake, 
                2, 
                "prev", 
                (item) => ({ primary: item.score, secondary: item.id })
            );

            // Reverses it natively returning (B, A) naturally mapped back to DESC UI conventions
            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe("B");
            expect(result.items[1].id).toBe("A");
            
            // The top of the new list (B) gets an upward prevCursor. 
            // The bottom (A) points naturally downward as nextCursor.
            expect(result.prevCursor).not.toBeNull();
            expect(result.nextCursor).not.toBeNull();
        });
    });
});
