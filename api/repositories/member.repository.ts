import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { OrgRole } from "@shared/auth/permissions";

export type AddMemberInput = {
    userId: string;
    organizationId: string;
    role: OrgRole;
};

/**
 * Repository for member-related database operations
 * Provides type-safe methods for organization membership management
 */
export class MemberRepository {
    constructor(private db: AppDb) { }

    /**
     * Add a user as a member to an organization
     * Uses direct DB insertion since server-side auth doesn't expose organization methods
     */
    async addMember(input: AddMemberInput): Promise<schema.AuthMember> {
        const memberId = nanoid();
        const now = new Date();

        await this.db.insert(schema.authMembers).values({
            id: memberId,
            organizationId: input.organizationId,
            userId: input.userId,
            role: input.role,
            createdAt: now,
        });

        return {
            id: memberId,
            userId: input.userId,
            organizationId: input.organizationId,
            role: input.role,
            createdAt: now,
        };
    }

    /**
     * Check if a user is already a member of an organization
     */
    async isMember(userId: string, organizationId: string): Promise<boolean> {
        const member = await this.db.query.authMembers.findFirst({
            where: and(
                eq(schema.authMembers.userId, userId),
                eq(schema.authMembers.organizationId, organizationId)
            ),
        });
        return !!member;
    }

    /**
     * Find membership details for a user in an organization
     * Returns null if user is not a member
     */
    async findMembership(userId: string, organizationId: string): Promise<schema.AuthMember | null> {
        const member = await this.db.query.authMembers.findFirst({
            where: and(
                eq(schema.authMembers.userId, userId),
                eq(schema.authMembers.organizationId, organizationId)
            ),
        });

        if (!member) {
            return null;
        }

        return {
            id: member.id,
            userId: member.userId,
            organizationId: member.organizationId,
            role: member.role,
            createdAt: member.createdAt,
        };
    }

    /**
     * Prepare a query to add a member for batching
     */
    prepareAdd(id: string, organizationId: string, userId: string, role: string) {
        const now = new Date();
        return this.db.insert(schema.authMembers).values({
            id,
            organizationId,
            userId,
            role,
            createdAt: now,
        });
    }

    /**
     * Finds all roles held by a caller in organizations where the target user is also a member.
     * Used for cross-org permission checks on user-scoped resources (like avatars).
     * 
     * @param callerId - The user performing the action
     * @param targetUserId - The user being acted upon
     * @returns Array of roles the caller holds in target user's organizations
     */
    async findCommonOrgRoles(callerId: string, targetUserId: string): Promise<string[]> {
        const targetMemberOrgs = await this.db.query.authMembers.findMany({
            where: eq(schema.authMembers.userId, targetUserId),
            columns: { organizationId: true }
        });

        const orgIds = targetMemberOrgs.map(m => m.organizationId);
        if (orgIds.length === 0) return [];

        const callerMemberships = await this.db.query.authMembers.findMany({
            where: and(
                eq(schema.authMembers.userId, callerId),
                inArray(schema.authMembers.organizationId, orgIds)
            ),
            columns: { role: true }
        });

        return callerMemberships.map(m => m.role);
    }
}
