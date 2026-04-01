import { BadRequestError } from "@api/errors/app.error";
import type { SocialMediaRepository } from "@api/repositories/social-media.repository";
import type * as schema from "@shared/db/schema";
import { BaseService } from "./base.service";

export class SocialMediaService extends BaseService {
    constructor(private socialRepo: SocialMediaRepository) {
        super();
    }

    /**
     * Find all global social media types (e.g., Twitter, LinkedIn).
     */
    async findSocialMediaTypes(): Promise<schema.SocialMediaType[]> {
        return await this.socialRepo.findAllTypes();
    }

    /**
     * Find all linked social media accounts for a user.
     */
    async findSocialMediasByUserId(userId: string): Promise<schema.UserSocialMediaWithRelations[]> {
        return await this.socialRepo.findAllByUser(userId);
    }

    /**
     * Link a social media account to a user's profile.
     */
    async linkSocialMedia(
        userId: string,
        socialMediaTypeId: string,
        urlOrHandle: string
    ): Promise<void> {
        if (!socialMediaTypeId || !urlOrHandle) {
            throw new BadRequestError("Social media identity payload missing explicitly.");
        }
        await this.socialRepo.insert({
            userId,
            socialMediaTypeId,
            urlOrHandle,
        });
    }

    /**
     * Update an existing social media link.
     */
    async updateLinkedSocialMedia(
        id: string,
        userId: string,
        socialMediaTypeId: string,
        urlOrHandle: string
    ): Promise<void> {
        if (!socialMediaTypeId || !urlOrHandle) {
            throw new BadRequestError("Social media identity payload missing explicitly.");
        }
        await this.socialRepo.update(id, userId, {
            socialMediaTypeId,
            urlOrHandle,
        });
    }

    /**
     * Remove a social media link from a user's profile.
     */
    async unlinkSocialMedia(id: string, userId: string): Promise<void> {
        await this.socialRepo.delete(id, userId);
    }
}
