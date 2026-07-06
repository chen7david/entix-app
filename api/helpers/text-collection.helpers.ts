import { toMs } from "@api/helpers/date.helpers";
import type { TextCollection } from "@shared/db/schema";

export function mapTextCollection(row: TextCollection) {
    return {
        id: row.id,
        organizationId: row.organizationId,
        title: row.title,
        author: row.author,
        description: row.description,
        type: row.type,
        cefrLevel: row.cefrLevel,
        bucketKey: row.bucketKey,
        r2Url: row.r2Url,
        totalPages: row.totalPages,
        createdAt: toMs(row.createdAt),
        updatedAt: toMs(row.updatedAt),
    };
}
