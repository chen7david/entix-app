import { SessionPaymentEventsRepository } from "@api/repositories/session-payment-events.repository";
import { authOrganizations, authUsers, scheduledSessions } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "../../lib/utils";
import { createTestDb } from "../../lib/utils";

describe("SessionPaymentEventsRepository Integration", () => {
    let db: TestDb;
    let repo: SessionPaymentEventsRepository;
    const orgId = "org_pay_event";
    const sessionId = "sess_pay_event";
    const userId = "user_pay_event";

    beforeEach(async () => {
        db = await createTestDb();
        repo = new SessionPaymentEventsRepository(db);

        // Setup prerequisites
        await db
            .insert(authOrganizations)
            .values({
                id: orgId,
                name: "Pay Event Org",
                slug: "pay-event-org",
                createdAt: new Date(),
            })
            .onConflictDoNothing();

        await db
            .insert(authUsers)
            .values({
                id: userId,
                name: "Pay Event User",
                email: "pay_event@example.com",
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
                title: "Pay Event Session",
                startTime: new Date(),
                durationMinutes: 60,
            })
            .onConflictDoNothing();
    });

    it("should insert and list payment events", async () => {
        await repo.insert({
            id: "pay_ev_1",
            sessionId,
            organizationId: orgId,
            userId,
            eventType: "paid",
            amountCents: 1000,
            performedBy: userId,
            createdAt: new Date(),
        });

        const list = await repo.listBySession(sessionId);
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe("pay_ev_1");
        expect(list[0].amountCents).toBe(1000);
    });

    it("should list events for a specific user in a session", async () => {
        await repo.insert({
            id: "pay_ev_2",
            sessionId,
            organizationId: orgId,
            userId,
            eventType: "paid",
            amountCents: 2000,
            performedBy: userId,
            createdAt: new Date(),
        });

        const userList = await repo.listByUserInSession(sessionId, userId);
        expect(userList).toHaveLength(1);
        expect(userList[0].id).toBe("pay_ev_2");
    });

    it("should reject a manual_paid event without a note (CHECK constraint)", async () => {
        // The DB schema enforces: manual_paid / manual_reset MUST have a note.
        // transactionId is NULL for manual events (no real money movement).
        await expect(
            repo.insert({
                id: "pay_ev_manual_no_note",
                sessionId,
                organizationId: orgId,
                userId,
                eventType: "manual_paid",
                // note intentionally omitted — violates manual_override_note_required check
                performedBy: userId,
                createdAt: new Date(),
            })
        ).rejects.toThrow();
    });

    it("should reject duplicate manual events for the same (sessionId, userId, eventType) (unique index)", async () => {
        // Insert the first manual_paid successfully
        await repo.insert({
            id: "pay_ev_manual_1",
            sessionId,
            organizationId: orgId,
            userId,
            eventType: "manual_paid",
            note: "First manual override",
            performedBy: userId,
            createdAt: new Date(),
        });

        // A second manual_paid for the same session + user must be rejected by the
        // partial unique index: uq_spe_session_user_manual (where transactionId IS NULL).
        await expect(
            repo.insert({
                id: "pay_ev_manual_2",
                sessionId,
                organizationId: orgId,
                userId,
                eventType: "manual_paid",
                note: "Duplicate manual override",
                performedBy: userId,
                createdAt: new Date(),
            })
        ).rejects.toThrow();
    });
});
