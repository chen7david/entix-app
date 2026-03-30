import { UserRepository } from "@api/repositories/user.repository";
import { authUsers as user } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockUser } from "../factories/user.factory";
import type { TestDb } from "../lib/utils";
import { createTestDb } from "../lib/utils";

describe("AuthUser Integration Test", () => {
    let db: TestDb;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("should create and retrieve a user", async () => {
        const newUser = createMockUser({
            name: "Test AuthUser",
            email: "test@example.com",
        });

        await db.insert(user).values(newUser);

        const result = await db.select().from(user).where(eq(user.id, newUser.id));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe(newUser.name);
        expect(result[0].email).toBe(newUser.email);
    });

    it("should update user data via UserRepository.updateUser", async () => {
        const newUser = createMockUser({
            name: "Update Test AuthUser",
            email: "update@example.com",
            emailVerified: false,
        });

        await db.insert(user).values(newUser);

        const repo = new UserRepository(db);
        await repo.updateUser(newUser.id, { emailVerified: true });

        const updatedUser = await db.query.authUsers.findFirst({
            where: eq(user.id, newUser.id),
        });

        expect(updatedUser?.emailVerified).toBe(true);
    });
});
