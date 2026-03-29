import { env } from "cloudflare:test";
import app from "@api/app";
import type { BulkMemberItemDTO } from "@shared/schemas/dto/bulk-member.dto";
import { nanoid } from "nanoid";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Hardened Member Import Integration", () => {
    let client: TestClient;
    let orgId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("should reject import when input.id conflicts with existing email owner", async () => {
        // 1. Create an existing user
        const existingEmail = "target@example.com";
        const setupPayload: BulkMemberItemDTO[] = [
            {
                email: existingEmail,
                name: "Original User",
                profile: { firstName: "Original", lastName: "User", sex: "other" },
            },
        ];
        await client.orgs.members.import(orgId, setupPayload);

        // Get the actual ID of the created user
        await client.orgs.users.list(orgId);

        // 2. Try to import the same email but with a DIFFERENT forced ID
        const conflictPayload: BulkMemberItemDTO[] = [
            {
                id: `wrong_id_${nanoid()}`,
                email: existingEmail,
                name: "Imposter",
            },
        ];

        const res = await client.orgs.members.import(orgId, conflictPayload);
        expect(res.status).toBe(200);
        const body = (await res.json()) as any;

        expect(body.failed).toBe(1);
        expect(body.errors[0]).toContain("Identity Conflict");
        expect(body.errors[0]).toContain(existingEmail);
    });

    it("should reject import when input.id belongs to another email", async () => {
        // 1. Create user A
        const emailA = "userA@example.com";
        await client.orgs.members.import(orgId, [{ email: emailA, name: "User A" }]);

        const listRes = await client.orgs.users.list(orgId);
        const users = (await listRes.json()) as any;
        const idA = users.items[0].id;

        // 2. Try to import email B but using ID A
        const emailB = "userB@example.com";
        const conflictPayload: BulkMemberItemDTO[] = [
            {
                id: idA,
                email: emailB,
                name: "Identity Thief",
            },
        ];

        const res = await client.orgs.members.import(orgId, conflictPayload);
        const body = (await res.json()) as any;

        expect(body.failed).toBe(1);
        expect(body.errors[0]).toContain("Identity Conflict");
        expect(body.errors[0]).toContain(idA);
    });
});
