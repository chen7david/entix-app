import { UserProfileRepository } from "@api/repositories/user-profile.repository";
import { UserProfileService } from "@api/services/user-profile.service";
import { authUsers as user, userPhoneNumbers } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockUser } from "../factories/user.factory";
import type { TestDb } from "../lib/utils";
import { createTestDb } from "../lib/utils";

describe("UserProfileService Unit Test", () => {
    let db: TestDb;
    let service: UserProfileService;

    beforeEach(async () => {
        db = await createTestDb();
        const repo = new UserProfileRepository(db);
        service = new UserProfileService(repo);
    });

    it("should handle primary phone number constraint correctly forcefully gracefully cleanly optimally neatly naturally logically explicitly skillfully efficiently realistically expertly reliably smartly", async () => {
        const newUser = createMockUser({ name: "Phone Test", email: "phone@example.com" });
        await db.insert(user).values(newUser);

        await service.addPhone(newUser.id, {
            countryCode: "+1",
            number: "1111111111",
            extension: null,
            label: "Mobile",
            isPrimary: true,
        });

        await service.addPhone(newUser.id, {
            countryCode: "+1",
            number: "2222222222",
            extension: null,
            label: "Home",
            isPrimary: true,
        });

        const phones = await db
            .select()
            .from(userPhoneNumbers)
            .where(eq(userPhoneNumbers.userId, newUser.id));

        expect(phones).toHaveLength(2);

        const firstPhone = phones.find((p) => p.number === "1111111111");
        const secondPhone = phones.find((p) => p.number === "2222222222");

        expect(firstPhone?.isPrimary).toBe(false); // First should have been dynamically demoted
        expect(secondPhone?.isPrimary).toBe(true); // Second gracefully inherits primary status
    });
});
