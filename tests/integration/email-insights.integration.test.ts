import { env } from "cloudflare:test";
import app from "@api/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseJson } from "../lib/api-request.helper";
import { createSuperAdmin, getAuthCookie } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Email Insights Integration", () => {
    beforeEach(async () => {
        await createTestDb();
    });

    describe("Authentication and Authorization", () => {
        it("returns 401 Unauthorized if no session cookie", async () => {
            const client = createTestClient(app, env); // No cookie passed
            const res = await client.request("/api/v1/admin/emails");
            expect(res.status).toBe(401);
        });

        it("returns 403 Forbidden for a regular user (not super admin)", async () => {
            const regularCookie = await getAuthCookie({
                app,
                env,
                user: {
                    email: `regular.${Date.now()}@example.com`,
                    password: "Password123!",
                    name: "Regular User",
                },
            });
            const client = createTestClient(app, env, regularCookie);
            const res = await client.request("/api/v1/admin/emails");
            expect(res.status).toBe(403);
        });
    });

    describe("Super Admin Access", () => {
        it("returns 200 OK for super admin accessing the list endpoint", async () => {
            const { cookie } = await createSuperAdmin({ app, env });
            const client = createTestClient(app, env, cookie);

            const { MailService } = await import("@api/services/mailer.service");
            const spy = vi.spyOn(MailService.prototype, "listEmails").mockResolvedValue({
                data: {
                    object: "list",
                    data: [
                        {
                            id: "1",
                            from: "Entix",
                            created_at: "2023-01-01",
                            to: ["test@example.com"],
                            subject: "Test",
                            last_event: "delivered",
                            bcc: [],
                            cc: [],
                            scheduled_at: null,
                            reply_to: [],
                        },
                    ],
                    has_more: false,
                } as any,
                error: null,
                headers: null,
            });

            const res = await client.request("/api/v1/admin/emails");

            expect(res.status).toBe(200);
            const body = await parseJson<any>(res);
            expect(Array.isArray(body.items)).toBe(true);
            expect(body.items.length).toBe(1);
            expect(body.items[0].id).toBe("1");

            spy.mockRestore();
        });

        it("returns 200 OK for super admin accessing the get endpoint", async () => {
            const { cookie } = await createSuperAdmin({ app, env });
            const client = createTestClient(app, env, cookie);

            const { MailService } = await import("@api/services/mailer.service");
            const spy = vi.spyOn(MailService.prototype, "getEmail").mockResolvedValue({
                data: {
                    object: "email",
                    id: "1",
                    from: "Entix",
                    created_at: "2023-01-01",
                    to: ["test@example.com"],
                    subject: "Test",
                    last_event: "delivered",
                    html: "<p>Hi</p>",
                    text: "Hi",
                    tags: [],
                    bcc: [],
                    cc: [],
                    scheduled_at: null,
                    reply_to: [],
                } as any,
                error: null,
                headers: null,
            });

            const res = await client.request("/api/v1/admin/emails/1");

            expect(res.status).toBe(200);
            const body = await parseJson<any>(res);
            expect(body.id).toBe("1");
            expect(body.html).toBe("<p>Hi</p>");

            spy.mockRestore();
        });

        it("returns 404 for missing email via get endpoint", async () => {
            const { cookie } = await createSuperAdmin({ app, env });
            const client = createTestClient(app, env, cookie);

            const { MailService } = await import("@api/services/mailer.service");
            const spy = vi.spyOn(MailService.prototype, "getEmail").mockResolvedValue({
                data: null,
                error: { name: "not_found", message: "Not found" } as any,
                headers: null,
            });

            const res = await client.request("/api/v1/admin/emails/missing-id");
            expect(res.status).toBe(404);

            spy.mockRestore();
        });
    });
});
