import { BadRequestError } from "@api/errors/app.error";
import type { SocialMediaRepository } from "@api/repositories/social-media.repository";
import type * as schema from "@shared/db/schema";

export class SocialMediaService {
    constructor(private socialRepo: SocialMediaRepository) {}

    async getGlobalSocialMediaTypes(): Promise<schema.SocialMediaType[]> {
        return await this.socialRepo.findAllSocialMediaTypes();
    }

    async getUserSocialMedias(userId: string): Promise<schema.UserSocialMediaWithRelations[]> {
        return await this.socialRepo.findUserSocialMedias(userId);
    }

    async linkSocialMedia(
        userId: string,
        socialMediaTypeId: string,
        urlOrHandle: string
    ): Promise<void> {
        if (!socialMediaTypeId || !urlOrHandle) {
            throw new BadRequestError("Social media identity payload missing explicitly.");
        }
        await this.socialRepo.insertUserSocialMedia({
            userId,
            socialMediaTypeId,
            urlOrHandle,
        });
    }

    async updateLinkedSocialMedia(
        id: string,
        userId: string,
        socialMediaTypeId: string,
        urlOrHandle: string
    ): Promise<void> {
        if (!socialMediaTypeId || !urlOrHandle) {
            throw new BadRequestError("Social media identity payload missing explicitly.");
        }
        await this.socialRepo.updateUserSocialMedia(id, userId, {
            socialMediaTypeId,
            urlOrHandle,
        });
    }

    async unlinkSocialMedia(id: string, userId: string): Promise<void> {
        await this.socialRepo.deleteUserSocialMedia(id, userId);
    }
}
