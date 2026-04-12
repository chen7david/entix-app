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

    it("should insert and list audit events", async () => {
        const auditId = "aud_1";
        await repo.insert({
            id: auditId,
            organizationId: orgId,
            eventType: "test_event",
            severity: "info",
            actorType: "system",
            message: "Test message",
            createdAt: new Date(),
        });

        const list = await repo.listByOrg(orgId);
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe(auditId);
        expect(list[0].message).toBe("Test message");
    });
});
