import { generateOpaqueId } from "@shared";
import type { NewAuthMember } from "@shared/db/schema";

export function createMockMember(overrides: Partial<NewAuthMember> = {}): NewAuthMember {
    return {
        id: generateOpaqueId(),
        organizationId: overrides.organizationId ?? generateOpaqueId(),
        userId: overrides.userId ?? generateOpaqueId(),
        role: "member",
        createdAt: new Date(),
        ...overrides,
    };
}
