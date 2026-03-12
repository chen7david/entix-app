import { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema.db";
import { eq, desc } from "drizzle-orm";

export type CreateOrganizationInput = {
    name: string;
    slug: string;
};

/**
 * Repository for organization-related database operations
 * Provides type-safe methods for organization management
 */
export class OrganizationRepository {
    constructor(private db: AppDb) { }

    /**
     * Find organization by slug
     */
    async findBySlug(slug: string): Promise<schema.Organization | undefined> {
        return await this.db.query.organization.findFirst({
            where: eq(schema.organization.slug, slug),
        });
    }

    /**
     * Get all organizations
     */
    async findAll(): Promise<schema.Organization[]> {
        return await this.db.select()
            .from(schema.organization)
            .orderBy(desc(schema.organization.createdAt));
    }

    /**
     * Find organization by ID
     */
    async findById(id: string): Promise<schema.Organization | undefined> {
        return await this.db.query.organization.findFirst({
            where: eq(schema.organization.id, id),
        });
    }

    /** Prepare a query to create an organization for batching
        */
    prepareCreate(id: string, name: string, slug: string) {
        const now = new Date();
        return this.db.insert(schema.organization).values({
            id,
            name,
            slug,
            createdAt: now,
        });
    }
}
