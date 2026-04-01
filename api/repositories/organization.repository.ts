import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { desc, eq } from "drizzle-orm";

export type CreateOrganizationInput = {
    name: string;
    slug: string;
};

/**
 * Repository for organization-related database operations
 * Provides type-safe methods for organization management
 */
export class OrganizationRepository {
    constructor(private db: AppDb) {}

    /**
     * Find organization by slug
     */
    async findBySlug(slug: string): Promise<schema.AuthOrganization | null> {
        const organization = await this.db.query.authOrganizations.findFirst({
            where: eq(schema.authOrganizations.slug, slug),
        });
        return organization ?? null;
    }

    /**
     * Get all organizations
     */
    async findAll(): Promise<schema.AuthOrganization[]> {
        return await this.db
            .select()
            .from(schema.authOrganizations)
            .orderBy(desc(schema.authOrganizations.createdAt));
    }

    /**
     * Find organization by ID
     */
    async findById(id: string): Promise<schema.AuthOrganization | null> {
        const organization = await this.db.query.authOrganizations.findFirst({
            where: eq(schema.authOrganizations.id, id),
        });
        return organization ?? null;
    }

    /**
     * Prepare a query to insert an organization for batching.
     */
    prepareInsert(id: string, name: string, slug: string) {
        const now = new Date();
        return this.db.insert(schema.authOrganizations).values({
            id,
            name,
            slug,
            createdAt: now,
        });
    }
}
