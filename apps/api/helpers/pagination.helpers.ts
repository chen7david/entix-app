import type { AnyColumn } from "drizzle-orm";
import { asc, desc, gt, lt, type SQL, sql } from "drizzle-orm";

export interface CursorPayload {
    primary: string | number | boolean;
    secondary?: string | number | boolean;
}

export function encodeCursor(payload: CursorPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload | null {
    try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        return JSON.parse(decoded) as CursorPayload;
    } catch {
        return null;
    }
}

/**
 * Generates Drizzle AST chunks for Cursor Pagination natively.
 *
 * @param primaryColumn The main sorting column (e.g., schema.members.createdAt)
 * @param secondaryColumn A unique identifier column for tie-breaking (e.g., schema.members.id)
 * @param cursorPayload The requested Base64 client cursor
 * @param direction 'next' or 'prev'.
 */
export function buildCursorPagination(
    primaryColumn: AnyColumn,
    secondaryColumn: AnyColumn,
    cursorPayload: string | undefined,
    direction: "next" | "prev" = "next"
) {
    const isNext = direction === "next";

    const orderBy = isNext
        ? [desc(primaryColumn), desc(secondaryColumn)]
        : [asc(primaryColumn), asc(secondaryColumn)];

    let whereClause: SQL<unknown> | undefined;

    if (cursorPayload) {
        const decoded = decodeCursor(cursorPayload);
        if (decoded && decoded.primary !== undefined) {
            if (decoded.secondary !== undefined) {
                whereClause = isNext
                    ? sql`(${primaryColumn} < ${decoded.primary} OR (${primaryColumn} = ${decoded.primary} AND ${secondaryColumn} < ${decoded.secondary}))`
                    : sql`(${primaryColumn} > ${decoded.primary} OR (${primaryColumn} = ${decoded.primary} AND ${secondaryColumn} > ${decoded.secondary}))`;
            } else {
                whereClause = isNext
                    ? lt(primaryColumn, decoded.primary)
                    : gt(primaryColumn, decoded.primary);
            }
        }
    }

    return { where: whereClause, orderBy };
}

/**
 * Reverses a 'prev' resulting array safely holding orientation
 */
export function processPaginatedResult<T>(
    items: T[],
    limit: number,
    direction: "next" | "prev",
    extractCursor: (item: T) => CursorPayload,
    requestCursor?: string
) {
    const hasMore = items.length > limit;
    const records = hasMore ? items.slice(0, limit) : items;

    if (direction === "prev") {
        records.reverse(); // put back into DESC order
    }

    let nextCursor = null;
    let prevCursor = null;

    if (records.length > 0) {
        if (direction === "next") {
            // Forward navigation: nextCursor exists if there are more items ahead
            if (hasMore) nextCursor = encodeCursor(extractCursor(records[records.length - 1]));
            // prevCursor exists if we are NOT on the very first page
            if (requestCursor) prevCursor = encodeCursor(extractCursor(records[0]));
        } else {
            // Backward navigation: prevCursor exists if there are more items behind
            if (hasMore) prevCursor = encodeCursor(extractCursor(records[0]));
            // nextCursor exists because we just came from the next page
            nextCursor = encodeCursor(extractCursor(records[records.length - 1]));
        }
    }

    return {
        items: records,
        nextCursor,
        prevCursor,
    };
}
