import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { drizzle } from "drizzle-orm/d1";
import { authUsers as user, authMembers as member, authOrganizations as organization } from "@shared/db/schema";
import { eq, and } from "drizzle-orm";
import { createMockUser } from "../factories/user.factory";
import { createMockOrganization } from "../factories/organization.factory";
import { createMockMember } from "../factories/member.factory";

describe("AuthMember Unique Constraint Test", () => {

    beforeEach(async () => {
        await createTestDb();
    });

    it("should prevent duplicate member entries for same user in same organization", async () => {
        const db = drizzle(env.DB);

        const testUser = createMockUser({ emailVerified: true });
        const testOrg = createMockOrganization();

        await db.insert(user).values(testUser);
        await db.insert(organization).values(testOrg);

        const member1 = createMockMember({
            organizationId: testOrg.id,
            userId: testUser.id,
            role: "member",
        });
        await db.insert(member).values(member1);

        let errorThrown = false;
        try {
            const member2 = createMockMember({
                organizationId: testOrg.id,
                userId: testUser.id,
                role: "admin", // Different role doesn't matter
            });
            await db.insert(member).values(member2);
        } catch (error: any) {
            errorThrown = true;
            const msg = error?.cause?.message ?? error?.message ?? String(error);
            expect(msg).toMatch(/UNIQUE/i);
        }

        expect(errorThrown).toBe(true);

        const members = await db.select().from(member).where(
            and(eq(member.userId, testUser.id), eq(member.organizationId, testOrg.id))
        );
        expect(members).toHaveLength(1);
    });

    it("should allow same user to be member of different organizations", async () => {
        const db = drizzle(env.DB);

        const testUser = createMockUser({ emailVerified: true });
        const testOrg1 = createMockOrganization();
        const testOrg2 = createMockOrganization();

        await db.insert(user).values(testUser);
        await db.insert(organization).values([testOrg1, testOrg2]);

        const member1 = createMockMember({
            organizationId: testOrg1.id,
            userId: testUser.id,
            role: "member",
        });
        await db.insert(member).values(member1);

        const member2 = createMockMember({
            organizationId: testOrg2.id,
            userId: testUser.id,
            role: "owner",
        });
        await db.insert(member).values(member2);

        const members = await db.select().from(member).where(
            eq(member.userId, testUser.id)
        );
        expect(members).toHaveLength(2);
    });

    it("should allow different users to be members of same organization", async () => {
        const db = drizzle(env.DB);

        const testUser1 = createMockUser({ emailVerified: true });
        const testUser2 = createMockUser({ emailVerified: true });
        const testOrg = createMockOrganization();

        await db.insert(user).values([testUser1, testUser2]);
        await db.insert(organization).values(testOrg);

        const member1 = createMockMember({
            organizationId: testOrg.id,
            userId: testUser1.id,
            role: "owner",
        });
        await db.insert(member).values(member1);

        const member2 = createMockMember({
            organizationId: testOrg.id,
            userId: testUser2.id,
            role: "member",
        });
        await db.insert(member).values(member2);

        const members = await db.select().from(member).where(
            eq(member.organizationId, testOrg.id)
        );
        expect(members).toHaveLength(2);
    });
});
