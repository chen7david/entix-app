import { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import { authOrganizations, authUsers, scheduledSessions } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "../../lib/utils";
import { createTestDb } from "../../lib/utils";

describe("SessionAttendancesRepository Integration", () => {
    let db: TestDb;
    let repo: SessionAttendancesRepository;
    const orgId = "org_attend";
    const sessionId = "sess_attend";
    const userId = "user_attend";

    beforeEach(async () => {
        db = await createTestDb();
        repo = new SessionAttendancesRepository(db);

        // Setup prerequisites
        await db
            .insert(authOrganizations)
            .values({ id: orgId, name: "Attend Org", slug: "attend-org", createdAt: new Date() })
            .onConflictDoNothing();

        await db
            .insert(authUsers)
            .values({
                id: userId,
                name: "Test User",
                email: "test@example.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoNothing();

        await db
            .insert(scheduledSessions)
            .values({
                id: sessionId,
                organizationId: orgId,
                title: "Attend Session",
                startTime: new Date(),
                durationMinutes: 60,
            })
            .onConflictDoNothing();
    });

    it("should upsert and find an attendance record", async () => {
        await repo.upsert({
            sessionId,
            organizationId: orgId,
            userId,
            paymentStatus: "unpaid",
        });

        const found = await repo.findByIds(sessionId, userId);
        expect(found).toBeDefined();
        expect(found?.paymentStatus).toBe("unpaid");

        // Test update via upsert
        await repo.upsert({
            sessionId,
            organizationId: orgId,
            userId,
            paymentStatus: "paid",
            notes: "Updated note",
        });

        const updated = await repo.findByIds(sessionId, userId);
        expect(updated?.paymentStatus).toBe("paid");
        expect(updated?.notes).toBe("Updated note");
    });

    it("should update payment status", async () => {
        await repo.upsert({
            sessionId,
            organizationId: orgId,
            userId,
            paymentStatus: "unpaid",
        });

        const updated = await repo.updatePaymentStatus(sessionId, userId, "paid");
        expect(updated?.paymentStatus).toBe("paid");

        const found = await repo.findByIds(sessionId, userId);
        expect(found?.paymentStatus).toBe("paid");
    });

    it("should list attendances by session", async () => {
        const userId2 = "user_attend_2";
        await db
            .insert(authUsers)
            .values({
                id: userId2,
                name: "Test User 2",
                email: "test2@example.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoNothing();

        await repo.upsert({ sessionId, organizationId: orgId, userId, paymentStatus: "unpaid" });
        await repo.upsert({
            sessionId,
            organizationId: orgId,
            userId: userId2,
            paymentStatus: "unpaid",
        });

        const list = await repo.listBySession(sessionId);
        expect(list).toHaveLength(2);
    });

    it("should delete an attendance record", async () => {
        await repo.upsert({ sessionId, organizationId: orgId, userId, paymentStatus: "unpaid" });

        const deleted = await repo.delete(sessionId, userId);
        expect(deleted).toBe(true);

        const found = await repo.findByIds(sessionId, userId);
        expect(found).toBeNull();
    });
});
