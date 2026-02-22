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
     * Get all organizations (Admin Use)
     */
    async getAll(limit: number = 100): Promise<schema.Organization[]> {
        const db = getDbClient(this.ctx);
        return await db.query.organization.findMany({
            limit,
            orderBy: (orgs, { desc }) => [desc(orgs.createdAt)],
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

    /**
     * Finds all pending invitations for an organization
     * Used exclusively for Super Admin bypass functionality
     */
    async findInvitationsByOrganization(organizationId: string) {
        const db = getDbClient(this.ctx);
        return await db.query.invitation.findMany({
            where: eq(schema.invitation.organizationId, organizationId),
        });
    }

    /**
     * Finds a pending invitation by email for an organization
     */
    async findPendingInvitationByEmail(email: string, organizationId: string) {
        const db = getDbClient(this.ctx);
        return await db.query.invitation.findFirst({
            where: (invitations, { eq, and }) => and(
                eq(invitations.organizationId, organizationId),
                eq(invitations.email, email),
                eq(invitations.status, 'pending')
            ),
        });
    }

    /**
     * Create a new invitation bypass (direct DB insertion)
     */
    async createInvitation(data: {
        organizationId: string;
        email: string;
        role: string;
        inviterId: string;
    }) {
        const db = getDbClient(this.ctx);
        const invitationId = nanoid();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

        const [invitation] = await db.insert(schema.invitation).values({
            id: invitationId,
            organizationId: data.organizationId,
            email: data.email,
            role: data.role,
            inviterId: data.inviterId,
            status: 'pending',
            createdAt: now,
            expiresAt,
        }).returning();

        return invitation;
    }

    /**
     * Cancel an invitation bypass
     */
    async cancelInvitation(invitationId: string) {
        const db = getDbClient(this.ctx);
        await db.update(schema.invitation)
            .set({ status: 'canceled' })
            .where(eq(schema.invitation.id, invitationId));
    }

}
