import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { and, eq, ne } from "drizzle-orm";

export class UserProfileRepository {
    constructor(private db: AppDb) {}

    async find(userId: string): Promise<schema.UserProfile | null> {
        return (
            (await this.db.query.userProfiles.findFirst({
                where: eq(schema.userProfiles.userId, userId),
            })) ?? null
        );
    }

    async insert(data: schema.NewUserProfile): Promise<void> {
        try {
            await this.db.insert(schema.userProfiles).values(data);
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async update(userId: string, data: Partial<schema.NewUserProfile>): Promise<void> {
        try {
            await this.db
                .update(schema.userProfiles)
                .set(data)
                .where(eq(schema.userProfiles.userId, userId));
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async findPhones(userId: string): Promise<schema.UserPhoneNumber[]> {
        return await this.db.query.userPhoneNumbers.findMany({
            where: eq(schema.userPhoneNumbers.userId, userId),
        });
    }

    async insertPhone(data: schema.NewUserPhoneNumber): Promise<void> {
        try {
            await this.db.insert(schema.userPhoneNumbers).values(data);
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async updatePhone(
        id: string,
        userId: string,
        data: Partial<schema.NewUserPhoneNumber>
    ): Promise<void> {
        try {
            await this.db
                .update(schema.userPhoneNumbers)
                .set(data)
                .where(
                    and(
                        eq(schema.userPhoneNumbers.id, id),
                        eq(schema.userPhoneNumbers.userId, userId)
                    )
                );
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async deletePhone(id: string, userId: string): Promise<void> {
        try {
            await this.db
                .delete(schema.userPhoneNumbers)
                .where(
                    and(
                        eq(schema.userPhoneNumbers.id, id),
                        eq(schema.userPhoneNumbers.userId, userId)
                    )
                );
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async unsetOtherPrimaryPhones(userId: string, excludeId: string): Promise<void> {
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

    async findAddresses(userId: string): Promise<schema.UserAddress[]> {
        return await this.db.query.userAddresses.findMany({
            where: eq(schema.userAddresses.userId, userId),
        });
    }

    async insertAddress(data: schema.NewUserAddress): Promise<void> {
        try {
            await this.db.insert(schema.userAddresses).values(data);
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async updateAddress(
        id: string,
        userId: string,
        data: Partial<schema.NewUserAddress>
    ): Promise<void> {
        try {
            await this.db
                .update(schema.userAddresses)
                .set(data)
                .where(
                    and(eq(schema.userAddresses.id, id), eq(schema.userAddresses.userId, userId))
                );
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async deleteAddress(id: string, userId: string): Promise<void> {
        try {
            await this.db
                .delete(schema.userAddresses)
                .where(
                    and(eq(schema.userAddresses.id, id), eq(schema.userAddresses.userId, userId))
                );
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async unsetOtherPrimaryAddresses(userId: string, excludeId: string): Promise<void> {
        try {
            await this.db
                .update(schema.userAddresses)
                .set({ isPrimary: false })
                .where(
                    and(
                        eq(schema.userAddresses.userId, userId),
                        ne(schema.userAddresses.id, excludeId)
                    )
                );
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    /**
     * Prepare a query to upsert a profile for batching
     */
    prepareUpsert(data: schema.NewUserProfile) {
        return this.db
            .insert(schema.userProfiles)
            .values(data)
            .onConflictDoUpdate({
                target: schema.userProfiles.userId,
                set: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    displayName: data.displayName,
                    sex: data.sex,
                    birthDate: data.birthDate,
                    updatedAt: new Date(),
                },
            });
    }

    /**
     * Prepare a query to delete all phone numbers for a user
     */
    preparePhoneDelete(userId: string) {
        return this.db
            .delete(schema.userPhoneNumbers)
            .where(eq(schema.userPhoneNumbers.userId, userId));
    }

    /**
     * Prepare a query to insert a phone number for batching
     */
    preparePhoneInsert(data: schema.NewUserPhoneNumber) {
        return this.db.insert(schema.userPhoneNumbers).values(data);
    }

    /**
     * Prepare a query to delete all addresses for a user
     */
    prepareAddressDelete(userId: string) {
        return this.db.delete(schema.userAddresses).where(eq(schema.userAddresses.userId, userId));
    }

    /**
     * Prepare a query to insert an address for batching
     */
    prepareAddressInsert(data: schema.NewUserAddress) {
        return this.db.insert(schema.userAddresses).values(data);
    }

    /**
     * Prepare a query to delete all social medias for a user
     */
    prepareSocialMediaDelete(userId: string) {
        return this.db
            .delete(schema.userSocialMedias)
            .where(eq(schema.userSocialMedias.userId, userId));
    }

    /**
     * Prepare a query to insert a social media for batching
     */
    prepareSocialMediaInsert(data: schema.NewUserSocialMedia) {
        return this.db.insert(schema.userSocialMedias).values(data);
    }
}
