import { env } from "cloudflare:test";
import app from "@api/app";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb } from "../lib/utils";

describe("Lesson Integration", () => {
    beforeEach(async () => {
        await createTestDb();
    });

    it("POST /api/v1/orgs/:organizationId/lessons creates a lesson with title-only payload", async () => {
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });

        const res = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/lessons`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookie,
                },
                body: JSON.stringify({
                    title: "Lesson Test",
                }),
            }),
            {},
            env
        );

        expect(res.status).toBe(201);
        const body = (await res.json()) as {
            id: string;
            organizationId: string;
            title: string;
            description: string | null;
            coverArtUrl: string | null;
            createdAt: number;
            updatedAt: number;
        };

        expect(body.title).toBe("Lesson Test");
        expect(body.organizationId).toBe(orgId);
        expect(body.description).toBeNull();
        expect(body.coverArtUrl).toBeNull();
        expect(typeof body.createdAt).toBe("number");
        expect(typeof body.updatedAt).toBe("number");
    });
});
