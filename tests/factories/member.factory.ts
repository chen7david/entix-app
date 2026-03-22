import { authMembers } from "@shared/db/schema";
import { nanoid } from "nanoid";

export function createMockMember(
    overrides: Partial<typeof member.$inferInsert> = {}
): typeof member.$inferInsert {
    return {
        id: nanoid(),
        organizationId: overrides.organizationId ?? nanoid(),
        userId: overrides.userId ?? nanoid(),
        role: "member",
        createdAt: new Date(),
        ...overrides,
    };
}
