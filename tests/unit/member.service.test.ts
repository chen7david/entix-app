import { MemberRepository } from "@api/repositories/member.repository";
import { MemberService } from "@api/services/member.service";
import {
    authMembers as member,
    authOrganizations as organization,
    authUsers as user,
} from "@shared/db/schema";
import { nanoid } from "nanoid";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockUser } from "../factories/user.factory";
import type { TestDb } from "../lib/utils";
import { createTestDb } from "../lib/utils";

describe("MemberService Unit Test", () => {
    let db: TestDb;
    let service: MemberService;

    beforeEach(async () => {
        db = await createTestDb();
        const repo = new MemberRepository(db);
        service = new MemberService(repo);
    });

    describe("getMember", () => {
        it("should return a member if they exist", async () => {
            const orgId = nanoid();
            const userId = nanoid();
            const memberId = nanoid();

            // Seed organization and user first (required for FK constraints)
            await db
                .insert(organization)
                .values({ id: orgId, name: "Test Org", slug: "test-org", createdAt: new Date() });
            const newUser = createMockUser({ id: userId });
            await db.insert(user).values(newUser);

            await db.insert(member).values({
                id: memberId,
                organizationId: orgId,
                userId: userId,
                role: "admin",
                createdAt: new Date(),
            });

            const result = await service.getMember(userId, orgId);
            expect(result).toBeDefined();
            expect(result.id).toBe(memberId);
        });

        it("should throw NotFoundError if member does not exist", async () => {
            const orgId = "non-existent-org";
            const userId = "non-existent-user";

            await expect(service.getMember(userId, orgId)).rejects.toThrowError(
                `User ${userId} is not a member of organization ${orgId}`
            );
        });
    });

    describe("existsMember", () => {
        it("should return true if member exists", async () => {
            const orgId = nanoid();
            const userId = nanoid();

            await db
                .insert(organization)
                .values({ id: orgId, name: "Test Org", slug: "test-org", createdAt: new Date() });
            const newUser = createMockUser({ id: userId });
            await db.insert(user).values(newUser);

            await db.insert(member).values({
                id: nanoid(),
                organizationId: orgId,
                userId: userId,
                role: "admin",
                createdAt: new Date(),
            });

            const result = await service.existsMember(userId, orgId);
            expect(result).toBe(true);
        });

        it("should return false if member does not exist", async () => {
            const result = await service.existsMember("any", "any");
            expect(result).toBe(false);
        });
    });
});
