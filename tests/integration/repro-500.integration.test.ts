import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import app from "@api/app";
import { sql } from "drizzle-orm";

describe("Reproduction of 500 Error in GET /uploads", () => {
    let db: any;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("should handle null or invalid dates in the database without crashing", async () => {
        const { orgId, orgData, cookie: authCookie } = await createAuthenticatedOrg({ app, env });
        const userId = orgData.user.id;

        // Insert a record with strange dates directly into DB using raw SQL to bypass Drizzle guards
        const uploadId = "test-upload-bad-date";
        await db.run(sql`
            INSERT INTO upload (id, original_name, bucket_key, url, file_size, content_type, status, organization_id, uploaded_by, created_at, updated_at)
            VALUES (${uploadId}, 'test.png', 'org/test.png', 'org/test.png', 1024, 'image/png', 'completed', ${orgId}, ${userId}, 'INVALID_DATE', 'INVALID_DATE')
        `);

        const res = await app.request(`/api/v1/orgs/${orgId}/uploads`, {
            method: "GET",
            headers: {
                cookie: authCookie,
            },
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any[];
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].id).toBe(uploadId);
        // Verify it returned null for the invalid date 'INVALID_DATE'
        expect(data[0].createdAt).toBe(null);
    });

    it("should return 200 even if R2 environment variables are partially missing", async () => {
        const { orgId, cookie: authCookie } = await createAuthenticatedOrg({ app, env });

        // We can't easily "unset" env in cloudflare:test for just one request without affecting others
        // but we can verify what happens if publicUrlPrefix construction logic gets weird.

        const res = await app.request(`/api/v1/orgs/${orgId}/uploads`, {
            method: "GET",
            headers: {
                cookie: authCookie,
            },
        }, {
            ...env,
            R2_ACCOUNT_ID: undefined,
            PUBLIC_ASSET_URL: undefined
        } as any);

        expect(res.status).toBe(200);
        const data = (await res.json()) as any[];
        // It might have "undefined" in the URL but shouldn't be 500
        expect(data).toBeDefined();
    });
});
