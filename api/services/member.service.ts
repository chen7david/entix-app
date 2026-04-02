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
    async existsMember(userId: string, organizationId: string): Promise<boolean> {
        return await this.memberRepo.exists(userId, organizationId);
    }

    /**
     * Find membership details (returns null if not found).
     */
    async findMember(userId: string, organizationId: string): Promise<schema.AuthMember | null> {
        return await this.memberRepo.find(userId, organizationId);
    }

    /**
     * Get membership details (throws NotFoundError if not found).
     */
    async getMember(userId: string, organizationId: string): Promise<schema.AuthMember> {
        const member = await this.findMember(userId, organizationId);
        return this.assertExists(
            member,
            `User ${userId} is not a member of organization ${organizationId}`
        );
    }

    /**
     * Add a user to an organization.
     * Throws ConflictError if user is already a member.
     */
    async insertMember(input: AddMemberInput): Promise<schema.AuthMember> {
        const existing = await this.findMember(input.userId, input.organizationId);
        if (existing) {
            throw new ConflictError(
                `User ${input.userId} is already a member of organization ${input.organizationId}`
            );
        }

        const member = await this.memberRepo.insert(input.organizationId, input.userId, input.role);
        if (!member) {
            throw new Error("Failed to insert member");
        }
        return member;
    }

    /**
     * Find all memberships for a list of user IDs in an organization.
     */
    async findMembersByUserIds(organizationId: string, userIds: string[]) {
        if (userIds.length === 0) {
            return [];
        }
        return await this.memberRepo.findByUserIds(organizationId, userIds);
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
    async findMembersDetailed(organizationId: string) {
        return await this.memberRepo.findAllDetailed(organizationId);
    }
}
