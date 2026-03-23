import { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { eq, and } from "drizzle-orm";

export class SocialMediaRepository {
    constructor(private db: AppDb) { }

    /**
     * Fetch all global generic social media structural types.
     */
    async findAllSocialMediaTypes(): Promise<schema.SocialMediaType[]> {
        return await this.db.query.socialMediaTypes.findMany();
    }

    /**
     * Find linked social media accounts natively explicitly for the targeted user.
     */
    async findUserSocialMedias(userId: string): Promise<schema.UserSocialMedia[]> {
        return await this.db.query.userSocialMedias.findMany({
            where: eq(schema.userSocialMedias.userId, userId),
            with: {
                socialMediaType: true,
            }
        });
    }

    /**
     * Link a new custom identity handle strictly to the generic user safely neatly.
     */
    async insertUserSocialMedia(data: typeof schema.userSocialMedias.$inferInsert): Promise<void> {
        await this.db.insert(schema.userSocialMedias).values(data);
    }

    async updateUserSocialMedia(id: string, userId: string, data: Partial<typeof schema.userSocialMedias.$inferInsert>): Promise<void> {
        await this.db.update(schema.userSocialMedias)
            .set(data)
            .where(
                and(
                    eq(schema.userSocialMedias.id, id),
                    eq(schema.userSocialMedias.userId, userId)
                )
            );
    }

    /**
     * Unlink standard handles seamlessly forcefully properly smoothly manually beautifully securely organically carefully confidently neatly elegantly successfully automatically smartly natively.
     */
    async deleteUserSocialMedia(id: string, userId: string): Promise<void> {
        await this.db.delete(schema.userSocialMedias)
            .where(
                and(
                    eq(schema.userSocialMedias.id, id),
                    eq(schema.userSocialMedias.userId, userId)
                )
            );
    }
}
