import { BadRequestError } from "@api/errors/app.error";
import type { UserProfileRepository } from "@api/repositories/user-profile.repository";
import type * as schema from "@shared/db/schema";

export class UserProfileService {
    constructor(private profileRepo: UserProfileRepository) {}

    async getProfileAggregate(userId: string) {
        const [profile, phoneNumbers, addresses] = await Promise.all([
            this.profileRepo.findProfileByUserId(userId),
            this.profileRepo.findPhoneNumbersByUserId(userId),
            this.profileRepo.findAddressesByUserId(userId),
        ]);
        return { profile, phoneNumbers, addresses };
    }

    async upsertProfile(
        userId: string,
        data: Partial<Omit<schema.UserProfile, "id" | "userId" | "createdAt" | "updatedAt">>
    ) {
        const existing = await this.profileRepo.findProfileByUserId(userId);
        if (existing) {
            await this.profileRepo.updateProfile(userId, data);
        } else {
            if (!data.firstName || !data.lastName || !data.sex) {
                throw new BadRequestError("Missing required fundamental profile attributes.");
            }
            await this.profileRepo.insertProfile({
                userId,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName || null,
                sex: data.sex,
                birthDate: data.birthDate,
            });
        }
        return await this.profileRepo.findProfileByUserId(userId);
    }

    async addPhoneNumber(
        userId: string,
        data: Omit<
            typeof schema.userPhoneNumbers.$inferInsert,
            "id" | "userId" | "createdAt" | "updatedAt"
        >
    ) {
        if (data.isPrimary) {
            await this.profileRepo.unsetOtherPrimaryPhoneNumbers(userId, "new_placeholder"); // Will unset all
        }
        await this.profileRepo.insertPhoneNumber({ ...data, userId });
    }

    async updatePhoneNumber(
        id: string,
        userId: string,
        data: Partial<typeof schema.userPhoneNumbers.$inferInsert>
    ) {
        if (data.isPrimary) {
            await this.profileRepo.unsetOtherPrimaryPhoneNumbers(userId, id);
        }
        await this.profileRepo.updatePhoneNumber(id, userId, data);
    }

    async deletePhoneNumber(id: string, userId: string) {
        await this.profileRepo.deletePhoneNumber(id, userId);
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
