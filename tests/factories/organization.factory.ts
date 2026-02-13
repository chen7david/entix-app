import { organization } from "@api/db/schema.db";
import { nanoid } from "nanoid";

export function createMockOrganization(overrides: Partial<typeof organization.$inferInsert> = {}): typeof organization.$inferInsert {
    const id = nanoid();
    const now = new Date();

    return {
        id: id,
        name: `Org ${id.substring(0, 8)}`,
        slug: `org-${id.substring(0, 8)}`.toLowerCase(),
        logo: null,
        metadata: null,
        createdAt: now,
        ...overrides,
    };
}
