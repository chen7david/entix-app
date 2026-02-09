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
