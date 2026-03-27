import type { AuthUser } from "@shared/db/schema";

export function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
    const now = new Date();
    const id = crypto.randomUUID();

    return {
        id: id,
        xid: id.substring(0, 8),
        name: `AuthUser ${id.substring(0, 8)}`,
        email: `user.${id.substring(0, 8)}@example.com`,
        emailVerified: false,
        image: null,
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
        theme: "system",
        timezone: "UTC",
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}
