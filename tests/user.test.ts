import { describe, it, expect } from "vitest";
import { createTestDb } from "./utils";
import { user } from "../api/db/schema.db";
import { eq } from "drizzle-orm";

describe("User Integration Test", () => {
    // Tests are run in isolation, so we can setup a fresh DB for each test file or test case
    // For now we just create one for this suite

    it("should create and retrieve a user", async () => {
        const db = await createTestDb();

        const newUser = {
            id: "user_123",
            name: "Test User",
            email: "test@example.com",
            role: "user",
            banned: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Insert
        await db.insert(user).values(newUser);

        // Retrieve
        const result = await db.select().from(user).where(eq(user.id, newUser.id));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe(newUser.name);
        expect(result[0].email).toBe(newUser.email);
    });
});
