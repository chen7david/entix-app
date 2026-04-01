import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

export class SocialMediaRepository {
    constructor(private db: AppDb) {}

    /**
     * Fetch all global generic social media structural types.
     */
    async findAllTypes(): Promise<schema.SocialMediaType[]> {
        return await this.db.query.socialMediaTypes.findMany();
    }

    /**
     * Find all linked social media accounts for a user.
     */
    async findAllByUser(userId: string): Promise<schema.UserSocialMediaWithRelations[]> {
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
    async insert(data: schema.NewUserSocialMedia): Promise<void> {
        try {
            await this.db.insert(schema.userSocialMedias).values(data);
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    async update(
        id: string,
        userId: string,
        data: Partial<schema.NewUserSocialMedia>
    ): Promise<void> {
        try {
            await this.db
                .update(schema.userSocialMedias)
                .set(data)
                .where(
                    and(
                        eq(schema.userSocialMedias.id, id),
                        eq(schema.userSocialMedias.userId, userId)
                    )
                );
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    /**
     * Delete a user's linked social media handle.
     */
    async delete(id: string, userId: string): Promise<void> {
        try {
            await this.db
                .delete(schema.userSocialMedias)
                .where(
                    and(
                        eq(schema.userSocialMedias.id, id),
                        eq(schema.userSocialMedias.userId, userId)
                    )
                );
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }
}
