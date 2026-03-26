import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";
import { BulkMemberItemDTO } from "@shared/schemas/dto/bulk-member.dto";

describe("Bulk Import Limit Reproduction", () => {
    let client: TestClient;
    let orgId: string;

    beforeEach(async () => {
        await createTestDb(); // Still initialize it if it performs global setup
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

        // 2. Verify listing structure for frontend compatibility
        const listRes = await client.orgs.users.list(orgId);
        expect(listRes.status).toBe(200);
        const listBody = await listRes.json() as any;
        
        expect(listBody.items.length).toBeGreaterThan(0);
        const firstItem = listBody.items[0];
        
        // Ensure both flat and nested properties exist
        expect(firstItem).toHaveProperty("name");
        expect(firstItem).toHaveProperty("user");
        expect(firstItem.user).toHaveProperty("name");
        expect(firstItem).toHaveProperty("userId");
        expect(firstItem.userId).toBe(firstItem.id);

        // 3. Verify consolidated global avatar removal route (fixed 404 issue)
        // This now works because the middleware performs a "Common Org" check.
        const deleteRes = await client.request(`/api/v1/users/${firstItem.id}/avatar`, {
            method: "DELETE"
        });
        // status is 204 or 404 if no avatar exists. 
        // We just want to ensure it's not a generic 404 Route Not Found.
        if (deleteRes.status === 404) {
            const body = await deleteRes.json() as any;
            expect(body.message).toBe("No avatar to remove");
        } else {
            expect(deleteRes.status).toBe(204);
        }
    });
});
