import { SignUpWithOrgDTO } from "@shared/schemas/dto/auth.dto";

export function createMockSignUpWithOrgPayload(overrides: Partial<SignUpWithOrgDTO> = {}): SignUpWithOrgDTO {
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    return {
        email: `test.user.${uniqueId}@example.com`,
        password: "password123",
        name: "Test User",
        organizationName: `Test Org ${uniqueId}`,
        ...overrides,
    };
}

export function createMockUserPayload(overrides: Partial<Omit<SignUpWithOrgDTO, "organizationName">> = {}): Omit<SignUpWithOrgDTO, "organizationName"> {
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    return {
        email: `test.user.${uniqueId}@example.com`,
        password: "password123",
        name: "Test User",
        ...overrides,
    };
}

export function createMockUserDbRecord(overrides: any = {}) {
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    return {
        id: `usr_${uniqueId}`,
        name: `Test User ${uniqueId}`,
        email: `test.user.${uniqueId}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
