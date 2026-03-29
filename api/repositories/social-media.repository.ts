import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

export class SocialMediaRepository {
    constructor(private db: AppDb) {}

    /**
     * Fetch all global generic social media structural types.
     */
    async findAllSocialMediaTypes(): Promise<schema.SocialMediaType[]> {
        return await this.db.query.socialMediaTypes.findMany();
    }

    /**
     * Find all linked social media accounts for a user.
     */
    async findUserSocialMedias(userId: string): Promise<schema.UserSocialMediaWithRelations[]> {
        return (await this.db.query.userSocialMedias.findMany({
            where: eq(schema.userSocialMedias.userId, userId),
            with: {
                socialMediaType: true,
            },
        })) as schema.UserSocialMediaWithRelations[];
    }

    /**
     * Link a social media handle to a user.
     */
    async insertUserSocialMedia(data: schema.NewUserSocialMedia): Promise<void> {
        await this.db.insert(schema.userSocialMedias).values(data);
    }

    async updateUserSocialMedia(
        id: string,
        userId: string,
        data: Partial<schema.NewUserSocialMedia>
    ): Promise<void> {
        await this.db
            .update(schema.userSocialMedias)
            .set(data)
            .where(
                and(eq(schema.userSocialMedias.id, id), eq(schema.userSocialMedias.userId, userId))
            );
    }

    /**
     * Delete a user's linked social media handle.
     */
    async deleteUserSocialMedia(id: string, userId: string): Promise<void> {
        await this.db
            .delete(schema.userSocialMedias)
            .where(
                and(eq(schema.userSocialMedias.id, id), eq(schema.userSocialMedias.userId, userId))
            );
    }
}
