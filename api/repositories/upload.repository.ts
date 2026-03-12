import { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema.db";
import { eq, and, desc } from "drizzle-orm";

export type CreateUploadInput = {
    id: string;
    originalName: string;
    bucketKey: string;
    url: string;
    fileSize: number;
    contentType: string;
    organizationId: string;
    uploadedBy: string;
    status: "pending" | "completed" | "failed";
};

export class UploadRepository {
    constructor(private db: AppDb) { }

    async create(input: CreateUploadInput): Promise<schema.Upload> {
        const [upload] = await this.db.insert(schema.upload).values(input).returning();
        return upload;
    }

    async findById(id: string, organizationId: string): Promise<schema.Upload | undefined> {
        return await this.db.query.upload.findFirst({
            where: and(
                eq(schema.upload.id, id),
                eq(schema.upload.organizationId, organizationId)
            ),
        });
    }

    async findByUrl(url: string, organizationId: string): Promise<schema.Upload | undefined> {
        return await this.db.query.upload.findFirst({
            where: and(
                eq(schema.upload.url, url),
                eq(schema.upload.organizationId, organizationId)
            ),
        });
    }

    async updateStatus(id: string, organizationId: string, status: "pending" | "completed" | "failed"): Promise<schema.Upload | undefined> {
        const [upload] = await this.db.update(schema.upload)
            .set({ status })
            .where(and(eq(schema.upload.id, id), eq(schema.upload.organizationId, organizationId)))
            .returning();
        return upload;
    }

    async findAllByOrganization(organizationId: string): Promise<schema.Upload[]> {
        return await this.db.select()
            .from(schema.upload)
            .where(eq(schema.upload.organizationId, organizationId))
            .orderBy(desc(schema.upload.createdAt));
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await this.db.delete(schema.upload)
            .where(and(eq(schema.upload.id, id), eq(schema.upload.organizationId, organizationId)))
            .returning();
        return result.length > 0;
    }
}
