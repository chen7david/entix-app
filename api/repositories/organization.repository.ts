import { AppContext } from "@api/helpers/types.helpers";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@api/db/schema.db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface CreateOrganizationInput {
    name: string;
    slug: string;
}

/**
 * Repository for organization-related database operations
 * Provides type-safe methods for organization management
 */
export class OrganizationRepository {
    constructor(private ctx: AppContext) { }

    /**
     * Create a new organization
     * @returns The ID of the created organization
     */
    async createOrganization(input: CreateOrganizationInput): Promise<string> {
        const db = getDbClient(this.ctx);
        const orgId = nanoid();
        const now = new Date();

        await db.insert(schema.organization).values({
            id: orgId,
            name: input.name,
            slug: input.slug,
            createdAt: now,
        });

        return orgId;
    }

    /**
     * Find organization by slug
     */
    async findBySlug(slug: string): Promise<schema.Organization | undefined> {
        const db = getDbClient(this.ctx);
        return await db.query.organization.findFirst({
            where: eq(schema.organization.slug, slug),
        });
    }

    /**
     * Find organization by ID
     */
    async findById(id: string): Promise<schema.Organization | undefined> {
        const db = getDbClient(this.ctx);
        return await db.query.organization.findFirst({
            where: eq(schema.organization.id, id),
        });
    }

    /**
     * Delete organization by ID
     * Used for compensating transactions during failed setups
     */
    async deleteOrganization(id: string): Promise<void> {
        const db = getDbClient(this.ctx);
        await db.delete(schema.organization).where(eq(schema.organization.id, id));
    }
}
