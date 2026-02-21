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

    /** Prepare a query to create an organization for batching
        */
    prepareCreate(id: string, name: string, slug: string) {
        const db = getDbClient(this.ctx);
        const now = new Date();
        return db.insert(schema.organization).values({
            id,
            name,
            slug,
            createdAt: now,
        });
    }
}
