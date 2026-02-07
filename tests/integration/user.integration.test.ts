import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, TestDb } from "../lib/utils";
import { user } from "@api/db/schema.db";
import { eq } from "drizzle-orm";
import { createMockUser } from "../factories/user.factory";

describe("User Integration Test", () => {
    let db: TestDb;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("should create and retrieve a user", async () => {
        const newUser = createMockUser({
            name: "Test User",
            email: "test@example.com"
        });

        // Insert
        await db.insert(user).values(newUser);

        // Retrieve
        const result = await db.select().from(user).where(eq(user.id, newUser.id));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe(newUser.name);
        expect(result[0].email).toBe(newUser.email);
    });
});
