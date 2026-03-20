import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { type AppDb } from "@api/factories/db.factory";
import { mediaSubtitles, type MediaSubtitle } from "@shared/db/schema.db";

export class MediaSubtitleRepository {
    constructor(private readonly db: AppDb) {}

    async create(data: Omit<MediaSubtitle, "createdAt">): Promise<MediaSubtitle> {
        const [record] = await this.db.insert(mediaSubtitles).values(data).returning();
        return record;
    }

    async listByMediaId(mediaId: string): Promise<MediaSubtitle[]> {
        return await this.db.query.mediaSubtitles.findMany({
            where: eq(mediaSubtitles.mediaId, mediaId),
            orderBy: [desc(mediaSubtitles.createdAt)],
        });
    }

    async getById(id: string): Promise<MediaSubtitle | undefined> {
        return await this.db.query.mediaSubtitles.findFirst({
            where: eq(mediaSubtitles.id, id),
        });
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(mediaSubtitles).where(eq(mediaSubtitles.id, id));
    }
}
