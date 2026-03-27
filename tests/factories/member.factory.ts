import { type NewAuthMember } from "@shared/db/schema";
import { nanoid } from "nanoid";

export function createMockMember(
    overrides: Partial<NewAuthMember> = {}
): NewAuthMember {
    return {
        id: nanoid(),
        organizationId: overrides.organizationId ?? nanoid(),
        userId: overrides.userId ?? nanoid(),
        role: "member",
        createdAt: new Date(),
        ...overrides,
    };
}
