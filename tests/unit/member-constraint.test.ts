import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { drizzle } from "drizzle-orm/d1";
import { user, member, organization } from "../../api/db/schema.db";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { createMockUser } from "../factories/user.factory";
import { createMockOrganization } from "../factories/organization.factory";

describe("Member Unique Constraint Test", () => {

    beforeEach(async () => {
        await createTestDb();
    });

    it("should prevent duplicate member entries for same user in same organization", async () => {
        const db = drizzle(env.DB);

        const testUser = createMockUser({ emailVerified: true });
        const testOrg = createMockOrganization();

        // Create user and organization
        await db.insert(user).values(testUser);
        await db.insert(organization).values(testOrg);

        // First insert should succeed
        await db.insert(member).values({
            id: nanoid(),
            organizationId: testOrg.id,
            userId: testUser.id,
            role: "member",
            createdAt: new Date(),
        });

        // Second insert with same userId and organizationId should fail
        let errorThrown = false;
        try {
            await db.insert(member).values({
                id: nanoid(),
                organizationId: testOrg.id,
                userId: testUser.id,
                role: "admin", // Different role doesn't matter
                createdAt: new Date(),
            });
        } catch (error: any) {
            errorThrown = true;
            // SQLite unique constraint error - check cause.message first as D1 wraps errors
            const msg = error?.cause?.message ?? error?.message ?? String(error);
            expect(msg).toMatch(/UNIQUE/i);
        }

        expect(errorThrown).toBe(true);

        // Verify only one member exists
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

        // Create user and two organizations
        await db.insert(user).values(testUser);
        await db.insert(organization).values([testOrg1, testOrg2]);

        // Add user to first org
        await db.insert(member).values({
            id: nanoid(),
            organizationId: testOrg1.id,
            userId: testUser.id,
            role: "member",
            createdAt: new Date(),
        });

        // Add same user to second org should succeed
        await db.insert(member).values({
            id: nanoid(),
            organizationId: testOrg2.id,
            userId: testUser.id,
            role: "owner",
            createdAt: new Date(),
        });

        // Verify two members exist
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

        // Create two users and one organization
        await db.insert(user).values([testUser1, testUser2]);
        await db.insert(organization).values(testOrg);

        // Add first user to org
        await db.insert(member).values({
            id: nanoid(),
            organizationId: testOrg.id,
            userId: testUser1.id,
            role: "owner",
            createdAt: new Date(),
        });

        // Add second user to same org should succeed
        await db.insert(member).values({
            id: nanoid(),
            organizationId: testOrg.id,
            userId: testUser2.id,
            role: "member",
            createdAt: new Date(),
        });

        // Verify two members exist
        const members = await db.select().from(member).where(
            eq(member.organizationId, testOrg.id)
        );
        expect(members).toHaveLength(2);
    });
});
