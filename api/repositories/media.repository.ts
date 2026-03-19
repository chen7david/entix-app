import { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema.db";
import { eq, and, desc } from "drizzle-orm";

export type CreateMediaInput = {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    mimeType: string;
    mediaUrl: string;
    coverArtUrl?: string;
    uploadedBy: string;
};

export class MediaRepository {
    constructor(private db: AppDb) { }

    async create(input: CreateMediaInput): Promise<schema.Media> {
        const [media] = await this.db.insert(schema.media).values(input).returning();
        return media;
    }

    async findById(id: string, organizationId: string): Promise<schema.Media | undefined> {
        return await this.db.query.media.findFirst({
            where: and(
                eq(schema.media.id, id),
                eq(schema.media.organizationId, organizationId)
            ),
        });
    }

    async findAllByOrganization(organizationId: string): Promise<schema.Media[]> {
        return await this.db.select()
            .from(schema.media)
            .where(eq(schema.media.organizationId, organizationId))
            .orderBy(desc(schema.media.createdAt));
    }

    async update(
        id: string,
        organizationId: string,
        updates: Partial<Pick<schema.Media, "title" | "description" | "coverArtUrl">>
    ): Promise<schema.Media | undefined> {
        const [updated] = await this.db.update(schema.media)
            .set({ ...updates, updatedAt: new Date() })
            .where(and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)))
            .returning();
        return updated;
    }

    async incrementPlayCount(id: string, organizationId: string): Promise<void> {
        // Drizzle specific atomic increment using SQL operator
        const { sql } = await import("drizzle-orm");
        await this.db.update(schema.media)
            .set({ playCount: sql`${schema.media.playCount} + 1` })
            .where(and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)));
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await this.db.delete(schema.media)
            .where(and(eq(schema.media.id, id), eq(schema.media.organizationId, organizationId)))
            .returning();
        return result.length > 0;
    }
}
