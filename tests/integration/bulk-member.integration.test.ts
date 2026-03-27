import { env } from "cloudflare:test";
import app from "@api/app";
import type { BulkMemberItemDTO, BulkMetricsDTO } from "@shared/schemas/dto/bulk-member.dto";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb, type TestDb } from "../lib/utils";

describe("Bulk Member Integration Tests", () => {
    let client: TestClient;
    let orgId: string;
    let db: TestDb;

    beforeEach(async () => {
        db = await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("should fetch dashboard metrics successfully", async () => {
        const res = await client.orgs.members.getMetrics(orgId);
        expect(res.status).toBe(200);
        const body = (await res.json()) as BulkMetricsDTO;
        expect(body).toHaveProperty("totalStorage");
        expect(body).toHaveProperty("activeSessions");
        expect(body).toHaveProperty("engagementRisk");
        expect(body).toHaveProperty("totalMembers");
        expect(body).toHaveProperty("upcomingBirthdays");
    });

    it("should export members successfully", async () => {
        const res = await client.orgs.members.export(orgId);
        expect(res.status).toBe(200);
        const body = (await res.json()) as BulkMemberItemDTO[];
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
    });

    it("should import members with full contact details", async () => {
        const payload: BulkMemberItemDTO[] = [
            {
                email: "full-contact@example.com",
                name: "Full Contact User",
                role: "owner", // Should be enforced to 'member'
                avatarUrl: "https://example.com/avatar.jpg",
                profile: {
                    firstName: "Full",
                    lastName: "Contact",
                    displayName: "FullDisplayName",
                    sex: "male",
                    birthDate: "1990-01-01",
                },
                phoneNumbers: [
                    {
                        countryCode: "+1",
                        number: "5551234",
                        extension: "123",
                        label: "Mobile",
                        isPrimary: true,
                    },
                ],
                addresses: [
                    {
                        country: "USA",
                        state: "NY",
                        city: "New York",
                        zip: "10001",
                        address: "123 Broadway",
                        label: "Home",
                        isPrimary: true,
                    },
                ],
                socialMedia: [{ type: "GitHub", urlOrHandle: "fullcontact" }],
            },
        ];

        const res = await client.orgs.members.import(orgId, payload);
        expect(res.status).toBe(200);

        const user = await db.query.authUsers.findFirst({
            where: (u, { eq }) => eq(u.email, "full-contact@example.com"),
            with: {
                profile: true,
                phoneNumbers: true,
                addresses: true,
                socialMedias: { with: { socialMediaType: true } },
            },
        });

        expect(user).toBeDefined();
        expect(user?.name).toBe("Full Contact User");
        expect(user?.image).toBe("https://example.com/avatar.jpg");
        expect(user?.profile?.displayName).toBe("FullDisplayName");

        const member = await db.query.authMembers.findFirst({
            where: (m, { and, eq }) => and(eq(m.userId, user!.id), eq(m.organizationId, orgId)),
        });
        expect(member?.role).toBe("member"); // Enforced role

        const account = await db.query.authAccounts.findFirst({
            where: (a, { eq }) => eq(a.userId, user!.id),
        });
        expect(account).toBeDefined();
        expect(account?.providerId).toBe("credential");
        expect(account?.password).toBeNull();

        expect(user?.phoneNumbers.length).toBe(1);
        expect(user?.phoneNumbers[0].number).toBe("5551234");
        expect(user?.phoneNumbers[0].extension).toBe("123");

        expect(user?.addresses.length).toBe(1);
        expect(user?.addresses[0].city).toBe("New York");

        expect(user?.socialMedias.length).toBe(1);
        expect(user?.socialMedias[0].socialMediaType.name).toBe("GitHub");
        expect(user?.socialMedias[0].urlOrHandle).toBe("fullcontact");
    });

    it("should handle partial success with some invalid emails", async () => {
        const payload: BulkMemberItemDTO[] = [
            {
                email: "valid@example.com",
                name: "Valid User",
            },
            {
                email: "invalid-email-no-at",
                name: "Invalid User",
            },
        ];

        const res = await client.orgs.members.import(orgId, payload);
        expect(res.status).toBe(200);

        const body = (await res.json()) as any;
        expect(body.total).toBe(2);
        expect(body.created).toBe(1);
        expect(body.failed).toBe(1);
        expect(body.errors.length).toBe(1);
        expect(body.errors[0]).toContain("Invalid email format");
    });

    it("should fail when user lacks permission", async () => {
        const res = await client.orgs.members.getMetrics("fake-org");
        expect(res.status).toBe(403);
    });
});
