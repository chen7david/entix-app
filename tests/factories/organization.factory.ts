import { authOrganizations } from "@shared/db/schema";
import { nanoid } from "nanoid";

export function createMockOrganization(overrides: Partial<typeof authOrganizations.$inferInsert> = {}): typeof authOrganizations.$inferInsert {
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
