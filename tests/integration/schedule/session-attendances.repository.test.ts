import { ConflictError, NotFoundError } from "@api/errors/app.error";
import { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import {
    authOrganizations,
    authUsers,
    lessons,
    scheduledSessions,
    sessionAttendances,
} from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "../../lib/utils";
import { createTestDb } from "../../lib/utils";

describe("SessionAttendancesRepository Integration", () => {
    let db: TestDb;
    let repo: SessionAttendancesRepository;
    const orgId = "org_attend";
    const sessionId = "sess_attend";
    const userId = "user_attend";
    const lessonId = "lesson_attend";

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
            .insert(lessons)
            .values({
                id: lessonId,
                organizationId: orgId,
                title: "Attendance Lesson",
            })
            .onConflictDoNothing();
        await db
            .insert(scheduledSessions)
            .values({
                id: sessionId,
                organizationId: orgId,
                lessonId,
                teacherId: userId,
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

    it("should list attendances with cursor pagination and filters", async () => {
        const userId2 = "user_attend_2";
        const userId3 = "user_attend_3";
        const now = new Date();

        // Seed more users
        await db
            .insert(authUsers)
            .values([
                {
                    id: userId2,
                    name: "User 2",
                    email: "test2@example.com",
                    emailVerified: true,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: userId3,
                    name: "User 3",
                    email: "test3@example.com",
                    emailVerified: true,
                    createdAt: now,
                    updatedAt: now,
                },
            ])
            .onConflictDoNothing();

        // Insert attendances with slightly different joinedAt to ensure predictable order
        await db.insert(sessionAttendances).values([
            {
                sessionId,
                organizationId: orgId,
                userId,
                paymentStatus: "paid",
                joinedAt: new Date(now.getTime() - 3000),
            },
            {
                sessionId,
                organizationId: orgId,
                userId: userId2,
                paymentStatus: "unpaid",
                joinedAt: new Date(now.getTime() - 2000),
            },
            {
                sessionId,
                organizationId: orgId,
                userId: userId3,
                paymentStatus: "unpaid",
                joinedAt: new Date(now.getTime() - 1000),
            },
        ]);

        // 1. Test forward pagination (limit 2)
        // Sort: joinedAt DESC, userId DESC
        // Expected order: User 3 (1000ms ago), User 2 (2000ms ago), User 1 (3000ms ago)
        const page1 = await repo.list({ organizationId: orgId, limit: 2 });
        expect(page1.items).toHaveLength(2);
        expect(page1.items[0].userId).toBe(userId3);
        expect(page1.items[1].userId).toBe(userId2);
        expect(page1.nextCursor).not.toBeNull();
        expect(page1.prevCursor).toBeNull();

        // 2. Test next page
        const page2 = await repo.list({
            organizationId: orgId,
            limit: 2,
            cursor: page1.nextCursor ?? undefined,
        });
        expect(page2.items).toHaveLength(1);
        expect(page2.items[0].userId).toBe(userId);
        expect(page2.nextCursor).toBeNull();
        expect(page2.prevCursor).not.toBeNull();

        // 3. Test backward pagination
        const backToPage1 = await repo.list({
            organizationId: orgId,
            limit: 2,
            cursor: page2.prevCursor ?? undefined,
            direction: "prev",
        });
        expect(backToPage1.items).toHaveLength(2);
        expect(backToPage1.items[0].userId).toBe(userId3);
        expect(backToPage1.items[1].userId).toBe(userId2);

        // 4. Test filters
        const unpaidOnly = await repo.list({
            organizationId: orgId,
            paymentStatus: "unpaid",
        });
        expect(unpaidOnly.items).toHaveLength(2);
        expect(unpaidOnly.items.every((a) => a.paymentStatus === "unpaid")).toBe(true);

        const sessionFiltered = await repo.list({
            organizationId: orgId,
            sessionId,
        });
        expect(sessionFiltered.items).toHaveLength(3);
    });

    it("should list all attendances for a specific session", async () => {
        await repo.upsert({ sessionId, organizationId: orgId, userId, paymentStatus: "unpaid" });
        const list = await repo.listBySession(sessionId);
        expect(list).toHaveLength(1);
        expect(list[0].userId).toBe(userId);
    });

    it("should delete an attendance record", async () => {
        await repo.upsert({ sessionId, organizationId: orgId, userId, paymentStatus: "unpaid" });

        const attendance = await repo.findByIds(sessionId, userId);
        expect(attendance).toBeDefined();
        const deleted = await repo.delete(attendance?.id ?? "", orgId, sessionId);
        expect(deleted).toBe(true);

        const found = await repo.findByIds(sessionId, userId);
        expect(found).toBeNull();
    });

    it("throws NotFoundError when session does not exist in org", async () => {
        await expect(
            repo.upsert({
                sessionId: "missing_session",
                organizationId: orgId,
                userId,
                paymentStatus: "unpaid",
            })
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws ConflictError when session is completed", async () => {
        await db
            .update(scheduledSessions)
            .set({ status: "completed" })
            .where(eq(scheduledSessions.id, sessionId));

        await expect(
            repo.upsert({
                sessionId,
                organizationId: orgId,
                userId,
                paymentStatus: "unpaid",
            })
        ).rejects.toBeInstanceOf(ConflictError);
    });
});
