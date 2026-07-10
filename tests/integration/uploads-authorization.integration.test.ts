import { env } from "cloudflare:test";
import app from "@api/app";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Uploads authorization", () => {
    let orgId: string;
    let ownerClient: TestClient;
    let studentClient: TestClient;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        orgId = id;
        ownerClient = createTestClient(app, env, cookie);

        const student = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: `student.uploads.${Date.now()}@example.com`,
        });
        studentClient = createTestClient(app, env, student.cookie);
    });

    it("student cannot list org uploads without upload:read", async () => {
        const res = await studentClient.request(`/api/v1/orgs/${orgId}/uploads`, {
            method: "GET",
        });
        expect(res.status).toBe(403);
    });

    it("owner can list org uploads", async () => {
        const res = await ownerClient.request(`/api/v1/orgs/${orgId}/uploads`, {
            method: "GET",
        });
        expect(res.status).toBe(200);
    });
});
