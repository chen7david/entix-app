import { ScheduledSessionsRepository } from "@api/repositories/scheduled-sessions.repository";
import { authOrganizations, type NewScheduledSession } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "../../lib/utils";
import { createTestDb } from "../../lib/utils";

describe("ScheduledSessionsRepository Integration", () => {
    let db: TestDb;
    let repo: ScheduledSessionsRepository;
    const orgId = "org_123";

    beforeEach(async () => {
        db = await createTestDb();
        repo = new ScheduledSessionsRepository(db);

        // Setup organization
        await db
            .insert(authOrganizations)
            .values({
                id: orgId,
                name: "Test Org",
                slug: "test-org",
                createdAt: new Date(),
            })
            .onConflictDoNothing();
    });

    it("should insert and find a session by ID", async () => {
        const sessionData: NewScheduledSession = {
            id: "sess_1",
            organizationId: orgId,
            title: "Test Session",
            startTime: new Date("2026-05-01T10:00:00Z"),
            durationMinutes: 60,
            status: "scheduled",
        };

        await repo.insert(sessionData);
        const found = await repo.findById("sess_1");

        expect(found).toBeDefined();
        expect(found?.title).toBe("Test Session");
        expect(found?.startTime.getTime()).toBe(sessionData.startTime.getTime());
    });

    it("should list sessions with cursor pagination sorted by startTime DESC", async () => {
        const baseDate = new Date("2026-05-01T10:00:00Z").getTime();

        // Insert 3 sessions
        for (let i = 1; i <= 3; i++) {
            await repo.insert({
                id: `sess_${i}`,
                organizationId: orgId,
                title: `Session ${i}`,
                startTime: new Date(baseDate + i * 1000 * 60 * 60), // 1 hour apart
                durationMinutes: 60,
            });
        }

        // List first 2 (should be sess_3, sess_2 due to DESC sort)
        const result1 = await repo.list({ organizationId: orgId, limit: 2 });
        expect(result1.items).toHaveLength(2);
        expect(result1.items[0].id).toBe("sess_3");
        expect(result1.items[1].id).toBe("sess_2");
        expect(result1.nextCursor).not.toBeNull();

        // List next page — cursor is guaranteed non-null by the assertion above
        const result2 = await repo.list({
            organizationId: orgId,
            limit: 2,
            cursor: result1.nextCursor ?? undefined,
        });
        expect(result2.items).toHaveLength(1);
        expect(result2.items[0].id).toBe("sess_1");
        expect(result2.nextCursor).toBeNull();
    });

    it("should update a session", async () => {
        await repo.insert({
            id: "sess_to_update",
            organizationId: orgId,
            title: "Original Title",
            startTime: new Date(),
            durationMinutes: 60,
        });

        const updated = await repo.update("sess_to_update", { title: "Updated Title" });
        expect(updated?.title).toBe("Updated Title");

        const found = await repo.findById("sess_to_update");
        expect(found?.title).toBe("Updated Title");
    });

    it("should delete a session", async () => {
        await repo.insert({
            id: "sess_to_delete",
            organizationId: orgId,
            title: "Delete Me",
            startTime: new Date(),
            durationMinutes: 60,
        });

        const deleted = await repo.delete("sess_to_delete");
        expect(deleted).toBe(true);

        const found = await repo.findById("sess_to_delete");
        expect(found).toBeNull();
    });
});
