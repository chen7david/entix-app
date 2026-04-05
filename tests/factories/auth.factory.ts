import type * as schema from "@shared/db/schema";
import { nanoid } from "nanoid";
import { vi } from "vitest";

/**
 * Creates a mocked Better Auth client for unit testing Services.
 */
export const createMockAuth = () => ({
    api: {
        signUpEmail: vi.fn(),
        requestPasswordReset: vi.fn(),
        // Add other auth.api methods as needed
    },
});

export type MockAuth = {
    api: {
        signUpEmail: any;
        requestPasswordReset: any;
    };
};

/**
 * Creates a mock payload for the signup-with-org endpoint.
 */
export const createMockSignUpWithOrgPayload = (
    overrides: Partial<{
        email: string;
        name: string;
        password?: string;
        organizationName?: string;
    }> = {}
) => {
    const id = Date.now();
    return {
        email: `test.${id}@example.com`,
        name: "Test User",
        password: "Password123!",
        organizationName: `Test Org ${id}`,
        ...overrides,
    };
};

/**
 * Creates a mock user record as it would appear in the database.
 */
export const createMockUserDbRecord = (
    overrides: Partial<schema.AuthUser> = {}
): schema.AuthUser => {
    const now = new Date();
    return {
        id: nanoid(),
        xid: nanoid(8).toUpperCase(),
        name: "Test User",
        email: `user.${Date.now()}@example.com`,
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
        theme: "system",
        timezone: null,
        ...overrides,
    };
};
