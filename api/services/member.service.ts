import { ConflictError } from "@api/errors/app.error";
import type { MemberRepository } from "@api/repositories/member.repository";
import type * as schema from "@shared/db/schema";
import { BaseService } from "./base.service";

export type AddMemberInput = {
    userId: string;
    organizationId: string;
    role: string;
};

export class MemberService extends BaseService {
    constructor(private memberRepo: MemberRepository) {
        super();
    }

    /**
     * Check if a user is a member of an organization.
     */
    async isMember(userId: string, organizationId: string): Promise<boolean> {
        return await this.memberRepo.isMember(userId, organizationId);
    }

    /**
     * Find membership details (returns null if not found).
     */
    async findMembership(
        userId: string,
        organizationId: string
    ): Promise<schema.AuthMember | null> {
        return await this.memberRepo.findMembership(userId, organizationId);
    }

    /**
     * Get membership details (throws NotFoundError if not found).
     */
    async getMembership(userId: string, organizationId: string): Promise<schema.AuthMember> {
        const member = await this.findMembership(userId, organizationId);
        return this.assertExists(
            member,
            `User ${userId} is not a member of organization ${organizationId}`
        );
    }

    /**
     * Add a user to an organization.
     * Throws ConflictError if user is already a member.
     */
    async addMember(input: AddMemberInput): Promise<schema.AuthMember> {
        const existing = await this.findMembership(input.userId, input.organizationId);
        if (existing) {
            throw new ConflictError(
                `User ${input.userId} is already a member of organization ${input.organizationId}`
            );
        }

        return await this.memberRepo.add(input.organizationId, input.userId, input.role);
    }

    /**
     * Find all memberships for a list of user IDs in an organization.
     */
    async findMembershipsByUserIds(organizationId: string, userIds: string[]) {
        if (userIds.length === 0) {
            return [];
        }
        return await this.memberRepo.findMembershipsByUserIds(organizationId, userIds);
    }

    /**
     * Finds common organization roles between two users.
     */
    async findCommonOrgRoles(callerId: string, targetUserId: string) {
        return await this.memberRepo.findCommonOrgRoles(callerId, targetUserId);
    }

    /**
     * Find all members with full profiles for export.
     */
    async findAllDetailed(organizationId: string) {
        return await this.memberRepo.findAllDetailed(organizationId);
    }
}
