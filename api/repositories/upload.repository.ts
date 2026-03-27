import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
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

export type CreateUserUploadInput = {
    id: string;
    userId: string;
    originalName: string;
    bucketKey: string;
    url: string;
    fileSize: number;
    contentType: string;
    status: "pending" | "completed" | "failed";
};

export class UploadRepository {
    constructor(private db: AppDb) { }

    async create(input: CreateUploadInput): Promise<schema.Upload> {
        const [upload] = await this.db.insert(schema.uploads).values(input).returning();
        return upload;
    }

    async findById(id: string, organizationId: string): Promise<schema.Upload | undefined> {
        return await this.db.query.uploads.findFirst({
            where: and(
                eq(schema.uploads.id, id),
                eq(schema.uploads.organizationId, organizationId)
            ),
        });
    }

    async findByUrl(url: string, organizationId: string): Promise<schema.Upload | undefined> {
        return await this.db.query.uploads.findFirst({
            where: and(
                eq(schema.uploads.url, url),
                eq(schema.uploads.organizationId, organizationId)
            ),
        });
    }

    async updateStatus(id: string, organizationId: string, status: "pending" | "completed" | "failed"): Promise<schema.Upload | undefined> {
        const [upload] = await this.db.update(schema.uploads)
            .set({ status })
            .where(and(eq(schema.uploads.id, id), eq(schema.uploads.organizationId, organizationId)))
            .returning();
        return upload;
    }

    async findAllByOrganization(organizationId: string): Promise<schema.Upload[]> {
        return await this.db.select()
            .from(schema.uploads)
            .where(eq(schema.uploads.organizationId, organizationId))
            .orderBy(desc(schema.uploads.createdAt));
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await this.db.delete(schema.uploads)
            .where(and(eq(schema.uploads.id, id), eq(schema.uploads.organizationId, organizationId)))
            .returning();
        return result.length > 0;
    }

    async deleteByBucketKey(bucketKey: string): Promise<boolean> {
        const result = await this.db.delete(schema.uploads)
            .where(eq(schema.uploads.bucketKey, bucketKey))
            .returning();
        return result.length > 0;
    }
}

export class UserUploadRepository {
    constructor(private db: AppDb) { }

    async create(input: CreateUserUploadInput): Promise<schema.UserUpload> {
        const [upload] = await this.db.insert(schema.userUploads).values(input).returning();
        return upload;
    }

    async findById(id: string, userId: string): Promise<schema.UserUpload | undefined> {
        return await this.db.query.userUploads.findFirst({
            where: and(
                eq(schema.userUploads.id, id),
                eq(schema.userUploads.userId, userId)
            ),
        });
    }

    async findByUrl(url: string, userId: string): Promise<schema.UserUpload | undefined> {
        return await this.db.query.userUploads.findFirst({
            where: and(
                eq(schema.userUploads.url, url),
                eq(schema.userUploads.userId, userId)
            ),
        });
    }

    async updateStatus(id: string, userId: string, status: "pending" | "completed" | "failed"): Promise<schema.UserUpload | undefined> {
        const [upload] = await this.db.update(schema.userUploads)
            .set({ status })
            .where(and(eq(schema.userUploads.id, id), eq(schema.userUploads.userId, userId)))
            .returning();
        return upload;
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await this.db.delete(schema.userUploads)
            .where(and(eq(schema.userUploads.id, id), eq(schema.userUploads.userId, userId)))
            .returning();
        return result.length > 0;
    }

    async deleteByBucketKey(bucketKey: string): Promise<boolean> {
        const result = await this.db.delete(schema.userUploads)
            .where(eq(schema.userUploads.bucketKey, bucketKey))
            .returning();
        return result.length > 0;
    }
}
