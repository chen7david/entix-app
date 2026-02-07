import { User } from "@api/db/schema.db";

export function createMockUser(overrides: Partial<User> = {}): User {
    const now = new Date();
    const id = crypto.randomUUID();

    return {
        id: id,
        name: `User ${id.substring(0, 8)}`,
        email: `user.${id.substring(0, 8)}@example.com`,
        emailVerified: false,
        image: null,
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}
