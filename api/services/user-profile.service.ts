import { BadRequestError } from "@api/errors/app.error";
import type { UserProfileRepository } from "@api/repositories/user-profile.repository";
import type * as schema from "@shared/db/schema";
import { BaseService } from "./base.service";

export class UserProfileService extends BaseService {
    constructor(private profileRepo: UserProfileRepository) {
        super();
    }

    async findProfileByUserId(userId: string) {
        return await this.profileRepo.find(userId);
    }

    async getProfileByUserId(userId: string) {
        const profile = await this.findProfileByUserId(userId);
        return this.assertExists(profile, `Profile for user ${userId} not found`);
    }

    async getProfileAggregate(userId: string) {
        const [profile, phones, addresses] = await Promise.all([
            this.findProfileByUserId(userId),
            this.profileRepo.findPhones(userId),
            this.profileRepo.findAddresses(userId),
        ]);
        return { profile, phones, addresses };
    }

    async upsertProfile(
        userId: string,
        data: Partial<Omit<schema.UserProfile, "id" | "userId" | "createdAt" | "updatedAt">>
    ) {
        const existing = await this.profileRepo.find(userId);
        if (existing) {
            await this.profileRepo.update(userId, data);
        } else {
            if (!data.firstName || !data.lastName || !data.sex) {
                throw new BadRequestError("Missing required fundamental profile attributes.");
            }
            await this.profileRepo.insert({
                userId,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName || null,
                sex: data.sex,
                birthDate: data.birthDate,
            });
        }
        return await this.profileRepo.find(userId);
    }

    async addPhone(
        userId: string,
        data: Omit<
            typeof schema.userPhoneNumbers.$inferInsert,
            "id" | "userId" | "createdAt" | "updatedAt"
        >
    ) {
        if (data.isPrimary) {
            await this.profileRepo.unsetOtherPrimaryPhones(userId, "new_placeholder"); // Will unset all
        }
        await this.profileRepo.insertPhone({ ...data, userId });
    }

    async updatePhone(
        id: string,
        userId: string,
        data: Partial<typeof schema.userPhoneNumbers.$inferInsert>
    ) {
        if (data.isPrimary) {
            await this.profileRepo.unsetOtherPrimaryPhones(userId, id);
        }
        await this.profileRepo.updatePhone(id, userId, data);
    }

    async deletePhone(id: string, userId: string) {
        await this.profileRepo.deletePhone(id, userId);
    }

    async addAddress(
        userId: string,
        data: Omit<
            typeof schema.userAddresses.$inferInsert,
            "id" | "userId" | "createdAt" | "updatedAt"
        >
    ) {
        if (data.isPrimary) {
            await this.profileRepo.unsetOtherPrimaryAddresses(userId, "new_placeholder");
        }
        await this.profileRepo.insertAddress({ ...data, userId });
    }

    async updateAddress(
        id: string,
        userId: string,
        data: Partial<typeof schema.userAddresses.$inferInsert>
    ) {
        if (data.isPrimary) {
            await this.profileRepo.unsetOtherPrimaryAddresses(userId, id);
        }
        await this.profileRepo.updateAddress(id, userId, data);
    }

    async deleteAddress(id: string, userId: string) {
        await this.profileRepo.deleteAddress(id, userId);
    }
}
