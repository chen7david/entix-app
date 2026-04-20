import { generateOpaqueId } from "@shared";
import type { NewAuthOrganization } from "@shared/db/schema";

export function createMockOrganization(
    overrides: Partial<NewAuthOrganization> = {}
): NewAuthOrganization {
    const id = generateOpaqueId();
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
