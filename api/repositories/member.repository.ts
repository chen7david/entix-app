import { AppContext } from "@api/helpers/types.helpers";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@api/db/schema.db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { OrgRole } from "@shared/auth/permissions";

export interface AddMemberInput {
    userId: string;
    organizationId: string;
    role: OrgRole;
}

/**
 * Repository for member-related database operations
 * Provides type-safe methods for organization membership management
 */
export class MemberRepository {
    constructor(private ctx: AppContext) { }

    /**
     * Add a user as a member to an organization
     * Uses direct DB insertion since server-side auth doesn't expose organization methods
     */
    async addMember(input: AddMemberInput): Promise<schema.Member> {
        const db = getDbClient(this.ctx);
        const memberId = nanoid();
        const now = new Date();

        await db.insert(schema.member).values({
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
        const db = getDbClient(this.ctx);
        const member = await db.query.member.findFirst({
            where: and(
                eq(schema.member.userId, userId),
                eq(schema.member.organizationId, organizationId)
            ),
        });
        return !!member;
    }

    /**
     * Find membership details for a user in an organization
     * Returns null if user is not a member
     */
    async findMembership(userId: string, organizationId: string): Promise<schema.Member | null> {
        const db = getDbClient(this.ctx);
        const member = await db.query.member.findFirst({
            where: and(
                eq(schema.member.userId, userId),
                eq(schema.member.organizationId, organizationId)
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
        const db = getDbClient(this.ctx);
        const now = new Date();
        return db.insert(schema.member).values({
            id,
            organizationId,
            userId,
            role,
            createdAt: now,
        });
    }
}
