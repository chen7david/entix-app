import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb, type TestDb } from "../lib/utils";
import { BulkMemberItemDTO } from "@shared/schemas/dto/bulk-member.dto";

describe("Bulk Import Limit Reproduction", () => {
    let client: TestClient;
    let orgId: string;
    let db: TestDb;

    beforeEach(async () => {
        db = await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("should handle 157 members without exceeding parameter limit", async () => {
        const payload: BulkMemberItemDTO[] = Array.from({ length: 157 }, (_, i) => ({
            email: `user${i}@example.com`,
            name: `User ${i}`,
            profile: {
                firstName: "User",
                lastName: i.toString(),
                sex: "other"
            }
        }));

        const res = await client.orgs.members.import(orgId, payload);
        expect(res.status).toBe(200);
        
        const body = await res.json() as any;
        expect(body.total).toBe(157);
        expect(body.failed).toBe(0);
        expect(body.created).toBe(157);
    });
});
