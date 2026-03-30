import type { AppDb } from "@api/factories/db.factory";
import type { OrgRole } from "@shared/auth/permissions";
import * as schema from "@shared/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

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
    constructor(private db: AppDb) {}

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
    async findMembership(
        userId: string,
        organizationId: string
    ): Promise<schema.AuthMember | null> {
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
     * Internal query builder for adding a member.
     * Used for batching operations (e.g. in RegistrationService).
     */
    createMemberQuery(id: string, organizationId: string, userId: string, role: string) {
        return this.db.insert(schema.authMembers).values({
            id,
            organizationId,
            userId,
            role,
            createdAt: new Date(),
        });
    }

    /**
     * Add a member to an organization and return the actual DB record.
     */
    async add(organizationId: string, userId: string, role: string): Promise<schema.AuthMember> {
        const id = nanoid();
        const results = await this.createMemberQuery(id, organizationId, userId, role).returning();

        const inserted = results[0];
        if (!inserted) {
            throw new Error("Failed to insert member");
        }

        return inserted;
    }

    /**
     * Find all memberships for a list of user IDs in an organization
     */
    async findMembershipsByUserIds(organizationId: string, userIds: string[]) {
        if (userIds.length === 0) return [];
        return await this.db.query.authMembers.findMany({
            where: and(
                eq(schema.authMembers.organizationId, organizationId),
                inArray(schema.authMembers.userId, userIds)
            ),
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
            columns: { organizationId: true },
        });

        const orgIds = targetMemberOrgs.map((m) => m.organizationId);
        if (orgIds.length === 0) return [];

        const callerMemberships = await this.db.query.authMembers.findMany({
            where: and(
                eq(schema.authMembers.userId, callerId),
                inArray(schema.authMembers.organizationId, orgIds)
            ),
            columns: { role: true },
        });

        return callerMemberships.map((m) => m.role);
    }

    /**
     * Find all members with their full user profile and contact details for export
     */
    async findAllDetailed(organizationId: string) {
        return await this.db.query.authMembers.findMany({
            where: eq(schema.authMembers.organizationId, organizationId),
            with: {
                user: {
                    with: {
                        profile: true,
                        phoneNumbers: true,
                        addresses: true,
                        socialMedias: {
                            with: {
                                socialMediaType: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
