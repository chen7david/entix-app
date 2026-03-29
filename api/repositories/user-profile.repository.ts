import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { and, eq, ne } from "drizzle-orm";

export class UserProfileRepository {
    constructor(private db: AppDb) {}

    async findProfileByUserId(userId: string): Promise<schema.UserProfile | undefined> {
        return await this.db.query.userProfiles.findFirst({
            where: eq(schema.userProfiles.userId, userId),
        });
    }

    async insertProfile(data: schema.NewUserProfile): Promise<void> {
        await this.db.insert(schema.userProfiles).values(data);
    }

    async updateProfile(userId: string, data: Partial<schema.NewUserProfile>): Promise<void> {
        await this.db
            .update(schema.userProfiles)
            .set(data)
            .where(eq(schema.userProfiles.userId, userId));
    }

    async findPhoneNumbersByUserId(userId: string): Promise<schema.UserPhoneNumber[]> {
        return await this.db.query.userPhoneNumbers.findMany({
            where: eq(schema.userPhoneNumbers.userId, userId),
        });
    }

    async insertPhoneNumber(data: schema.NewUserPhoneNumber): Promise<void> {
        await this.db.insert(schema.userPhoneNumbers).values(data);
    }

    async updatePhoneNumber(
        id: string,
        userId: string,
        data: Partial<schema.NewUserPhoneNumber>
    ): Promise<void> {
        await this.db
            .update(schema.userPhoneNumbers)
            .set(data)
            .where(
                and(eq(schema.userPhoneNumbers.id, id), eq(schema.userPhoneNumbers.userId, userId))
            );
    }

    async deletePhoneNumber(id: string, userId: string): Promise<void> {
        await this.db
            .delete(schema.userPhoneNumbers)
            .where(
                and(eq(schema.userPhoneNumbers.id, id), eq(schema.userPhoneNumbers.userId, userId))
            );
    }

    async unsetOtherPrimaryPhoneNumbers(userId: string, excludeId: string): Promise<void> {
        await this.db
            .update(schema.userPhoneNumbers)
            .set({ isPrimary: false })
            .where(
                and(
                    eq(schema.userPhoneNumbers.userId, userId),
                    ne(schema.userPhoneNumbers.id, excludeId)
                )
            );
    }

    async findAddressesByUserId(userId: string): Promise<schema.UserAddress[]> {
        return await this.db.query.userAddresses.findMany({
            where: eq(schema.userAddresses.userId, userId),
        });
    }

    async insertAddress(data: schema.NewUserAddress): Promise<void> {
        await this.db.insert(schema.userAddresses).values(data);
    }

    async updateAddress(
        id: string,
        userId: string,
        data: Partial<schema.NewUserAddress>
    ): Promise<void> {
        await this.db
            .update(schema.userAddresses)
            .set(data)
            .where(and(eq(schema.userAddresses.id, id), eq(schema.userAddresses.userId, userId)));
    }

    async deleteAddress(id: string, userId: string): Promise<void> {
        await this.db
            .delete(schema.userAddresses)
            .where(and(eq(schema.userAddresses.id, id), eq(schema.userAddresses.userId, userId)));
    }

    async unsetOtherPrimaryAddresses(userId: string, excludeId: string): Promise<void> {
        await this.db
            .update(schema.userAddresses)
            .set({ isPrimary: false })
            .where(
                and(eq(schema.userAddresses.userId, userId), ne(schema.userAddresses.id, excludeId))
            );
    }
}
