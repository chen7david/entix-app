import { SystemAuditRepository } from "@api/repositories/system-audit.repository";
import { authOrganizations } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "../../lib/utils";
import { createTestDb } from "../../lib/utils";

describe("SystemAuditRepository Integration", () => {
    let db: TestDb;
    let repo: SystemAuditRepository;
    const orgId = "org_audit_test";

    beforeEach(async () => {
        db = await createTestDb();
        repo = new SystemAuditRepository(db);

        // Setup prerequisites
        await db
            .insert(authOrganizations)
            .values({ id: orgId, name: "Audit Org", slug: "audit-org", createdAt: new Date() })
            .onConflictDoNothing();
    });

    it("should list audit events with cursor pagination and filters", async () => {
        const now = new Date();

        // Insert multiple events with slightly different createdAt for predictable order
        await repo.insert({
            id: "aud_1",
            organizationId: orgId,
            eventType: "test_event",
            severity: "info",
            actorType: "system",
            message: "First event",
            createdAt: new Date(now.getTime() - 3000),
        });
        await repo.insert({
            id: "aud_2",
            organizationId: orgId,
            eventType: "user_login",
            severity: "warning",
            actorType: "user",
            actorId: "user_ref",
            message: "Second event",
            createdAt: new Date(now.getTime() - 2000),
        });
        await repo.insert({
            id: "aud_3",
            organizationId: orgId,
            eventType: "system_error",
            severity: "error",
            actorType: "system",
            message: "Third event",
            createdAt: new Date(now.getTime() - 1000),
            acknowledgedAt: new Date(),
        });

        // 1. Test forward pagination (limit 2)
        // Sort: createdAt DESC, id DESC
        // Expected order: aud_3, aud_2, aud_1
        const page1 = await repo.list({ organizationId: orgId, limit: 2 });
        expect(page1.items).toHaveLength(2);
        expect(page1.items[0].id).toBe("aud_3");
        expect(page1.items[1].id).toBe("aud_2");
        expect(page1.nextCursor).not.toBeNull();

        // 2. Test next page
        const page2 = await repo.list({
            organizationId: orgId,
            limit: 2,
            cursor: page1.nextCursor ?? undefined,
        });
        expect(page2.items).toHaveLength(1);
        expect(page2.items[0].id).toBe("aud_1");
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
        expect(backToPage1.items[0].id).toBe("aud_3");

        // 4. Test filters
        const unresolvedOnly = await repo.list({
            organizationId: orgId,
            unresolvedOnly: true,
        });
        expect(unresolvedOnly.items).toHaveLength(2); // aud_1, aud_2
        expect(unresolvedOnly.items.some((e) => e.id === "aud_3")).toBe(false);

        const errorOnly = await repo.list({
            organizationId: orgId,
            severity: "error",
        });
        expect(errorOnly.items).toHaveLength(1);
        expect(errorOnly.items[0].id).toBe("aud_3");

        const userActorOnly = await repo.list({
            organizationId: orgId,
            actorId: "user_ref",
        });
        expect(userActorOnly.items).toHaveLength(1);
        expect(userActorOnly.items[0].id).toBe("aud_2");
    });

    it("findByIdAndOrganization returns null when org does not match", async () => {
        await repo.insert({
            id: "aud_org_scoped",
            organizationId: orgId,
            eventType: "test",
            severity: "info",
            actorType: "system",
            message: "scoped",
            createdAt: new Date(),
        });
        const found = await repo.findByIdAndOrganization("aud_org_scoped", orgId);
        expect(found?.id).toBe("aud_org_scoped");
        const wrongOrg = await repo.findByIdAndOrganization("aud_org_scoped", "org_other");
        expect(wrongOrg).toBeNull();
    });

    it("setAcknowledged with organizationId only updates matching row", async () => {
        await repo.insert({
            id: "aud_ack_org",
            organizationId: orgId,
            eventType: "test",
            severity: "info",
            actorType: "system",
            message: "ack test",
            createdAt: new Date(),
        });
        await repo.setAcknowledged("aud_ack_org", {
            at: new Date(),
            acknowledgedBy: null,
            organizationId: orgId,
        });
        const row = await repo.findByIdAndOrganization("aud_ack_org", orgId);
        expect(row?.acknowledgedBy).toBeNull();
        expect(row?.acknowledgedAt).toBeInstanceOf(Date);
    });
});
