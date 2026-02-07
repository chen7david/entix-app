import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, TestDb } from "../lib/utils";
import { createMockUser } from "../factories/user.factory";
import { user } from "@api/db/schema.db";
import app from "@api/app";
import { env } from "cloudflare:test";

describe("API Integration Test", () => {
    let db: TestDb;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("GET /api/v1/users should return list of users", async () => {
        // 1. Setup: Insert a user directly into DB
        const mockUser = createMockUser({ name: "API User" });
        await db.insert(user).values(mockUser);

        // 2. Act: Call the API
        const res = await app.request("/api/v1/users", {}, env);

        // 3. Assert: Check response
        expect(res.status).toBe(200);

        // Strict typing: Cast unknown body to expected type
        const body: typeof user.$inferSelect[] = await res.json();

        expect(body).toBeInstanceOf(Array);
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
            id: mockUser.id,
            name: "API User",
            email: mockUser.email,
        });
    });

    it("GET /api/v1/unknown should return 404 JSON", async () => {
        const res = await app.request("/api/v1/unknown-route", {}, env);
        expect(res.status).toBe(404);
        const body: { message?: string, error?: string } = await res.json();
    });
});
