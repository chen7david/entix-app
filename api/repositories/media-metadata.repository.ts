import { eq } from "drizzle-orm";
import { type AppDb } from "@api/factories/db.factory";
import { mediaMetadata, type MediaMetadata } from "@shared/db/schema.db";

export class MediaMetadataRepository {
    constructor(private readonly db: AppDb) {}

    async create(data: Omit<MediaMetadata, "createdAt" | "updatedAt">): Promise<MediaMetadata> {
        const [record] = await this.db.insert(mediaMetadata).values(data).returning();
        return record;
    }

    async getByMediaId(mediaId: string): Promise<MediaMetadata | undefined> {
        return await this.db.query.mediaMetadata.findFirst({
            where: eq(mediaMetadata.mediaId, mediaId),
        });
    }

    async update(mediaId: string, data: Partial<Omit<MediaMetadata, "mediaId" | "createdAt" | "updatedAt">>): Promise<MediaMetadata | undefined> {
        const [record] = await this.db
            .update(mediaMetadata)
            .set(data)
            .where(eq(mediaMetadata.mediaId, mediaId))
            .returning();
        return record;
    }

    async upsert(mediaId: string, data: Partial<Omit<MediaMetadata, "mediaId" | "createdAt" | "updatedAt">> & { source?: string }): Promise<MediaMetadata> {
        const existing = await this.getByMediaId(mediaId);
        if (existing) {
            const updated = await this.update(mediaId, data);
            return updated!; // Ensure it exists
        }
        return await this.create({
            mediaId,
            source: data.source || "manual",
            externalId: data.externalId ?? null,
            externalLikeCount: data.externalLikeCount ?? 0,
            externalViewCount: data.externalViewCount ?? 0,
            channelName: data.channelName ?? null,
            channelId: data.channelId ?? null,
            tags: data.tags ?? null,
        });
    }

    async delete(mediaId: string): Promise<void> {
        await this.db.delete(mediaMetadata).where(eq(mediaMetadata.mediaId, mediaId));
    }
}
