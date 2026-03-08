import { AppContext } from "@api/helpers/types.helpers";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@api/db/schema.db";
import { eq, and, desc } from "drizzle-orm";

export interface CreateUploadInput {
    id: string;
    originalName: string;
    bucketKey: string;
    url: string;
    fileSize: number;
    contentType: string;
    organizationId: string;
    uploadedBy: string;
    status: "pending" | "completed" | "failed";
}

export class UploadRepository {
    constructor(private ctx: AppContext) { }

    async create(input: CreateUploadInput): Promise<schema.Upload> {
        const db = getDbClient(this.ctx);
        const [upload] = await db.insert(schema.upload).values(input).returning();
        return upload;
    }

    async findById(id: string, organizationId: string): Promise<schema.Upload | undefined> {
        const db = getDbClient(this.ctx);
        return await db.query.upload.findFirst({
            where: and(
                eq(schema.upload.id, id),
                eq(schema.upload.organizationId, organizationId)
            ),
        });
    }

    async findByUrl(url: string, organizationId: string): Promise<schema.Upload | undefined> {
        const db = getDbClient(this.ctx);
        return await db.query.upload.findFirst({
            where: and(
                eq(schema.upload.url, url),
                eq(schema.upload.organizationId, organizationId)
            ),
        });
    }

    async updateStatus(id: string, organizationId: string, status: "pending" | "completed" | "failed"): Promise<schema.Upload | undefined> {
        const db = getDbClient(this.ctx);
        const [upload] = await db.update(schema.upload)
            .set({ status })
            .where(and(eq(schema.upload.id, id), eq(schema.upload.organizationId, organizationId)))
            .returning();
        return upload;
    }

    async findAllByOrganization(organizationId: string): Promise<schema.Upload[]> {
        const db = getDbClient(this.ctx);
        return await db.select()
            .from(schema.upload)
            .where(eq(schema.upload.organizationId, organizationId))
            .orderBy(desc(schema.upload.createdAt));
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const db = getDbClient(this.ctx);
        const result = await db.delete(schema.upload)
            .where(and(eq(schema.upload.id, id), eq(schema.upload.organizationId, organizationId)))
            .returning();
        return result.length > 0;
    }
}
