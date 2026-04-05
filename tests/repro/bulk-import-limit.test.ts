import { env } from "cloudflare:test";
import app from "@api/app";
import type { BulkMemberItemDTO } from "@shared/schemas/dto/bulk-member.dto";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

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
                sex: "other",
            },
        }));

        const res = await client.orgs.members.import(orgId, payload);
        expect(res.status).toBe(200);

        const body = (await res.json()) as any;
        expect(body.total).toBe(157);
        expect(body.failed).toBe(0);
        expect(body.created).toBe(157);

        const listRes = await client.orgs.users.list(orgId);
        expect(listRes.status).toBe(200);
        const listBody = (await listRes.json()) as any;

        expect(listBody.items.length).toBeGreaterThan(0);
        const firstItem = listBody.items[0];

        expect(firstItem).toHaveProperty("name");
        expect(firstItem).toHaveProperty("userId");
        expect(firstItem.userId).toBeDefined();

        const deleteRes = await client.request(`/api/v1/users/${firstItem.userId}/avatar`, {
            method: "DELETE",
        });
        if (deleteRes.status === 404) {
            const body = (await deleteRes.json()) as any;
            expect(body.message).toBe("No avatar to remove");
        } else {
            expect(deleteRes.status).toBe(204);
        }
    });
});
