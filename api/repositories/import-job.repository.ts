import type { AppDb } from "@api/factories/db.factory";
import type {
    BulkInsertParagraphsInput,
    CreateImportJobInput,
    ImportParagraphItem,
    UpdateImportJobInput,
    UpdateImportParagraphInput,
} from "@shared/schemas/dto/import-job.dto";
import * as schema from "@shared/db/schema";
import { and, asc, count, eq } from "drizzle-orm";

export class ImportJobRepository {
    constructor(private readonly db: AppDb) {}

    async createJob(organizationId: string, createdBy: string, data: CreateImportJobInput) {
        const [row] = await this.db
            .insert(schema.importJobs)
            .values({ organizationId, createdBy, ...data })
            .returning();
        return row;
    }

    async getJob(organizationId: string, jobId: string) {
        return this.db.query.importJobs.findFirst({
            where: and(
                eq(schema.importJobs.id, jobId),
                eq(schema.importJobs.organizationId, organizationId)
            ),
            with: {
                paragraphs: {
                    orderBy: [
                        asc(schema.importJobParagraphs.pageNumber),
                        asc(schema.importJobParagraphs.paragraphIndex),
                    ],
                },
            },
        });
    }

    async listJobs(organizationId: string) {
        return this.db.query.importJobs.findMany({
            where: eq(schema.importJobs.organizationId, organizationId),
            orderBy: (t, { desc }) => [desc(t.createdAt)],
        });
    }

    async updateJob(organizationId: string, jobId: string, data: UpdateImportJobInput) {
        const [row] = await this.db
            .update(schema.importJobs)
            .set(data)
            .where(
                and(
                    eq(schema.importJobs.id, jobId),
                    eq(schema.importJobs.organizationId, organizationId)
                )
            )
            .returning();
        return row ?? null;
    }

    async deleteJob(organizationId: string, jobId: string) {
        const result = await this.db
            .delete(schema.importJobs)
            .where(
                and(
                    eq(schema.importJobs.id, jobId),
                    eq(schema.importJobs.organizationId, organizationId)
                )
            )
            .returning({ id: schema.importJobs.id });
        return result.length > 0;
    }

    prepareInsertParagraph(jobId: string, paragraph: ImportParagraphItem) {
        return this.db.insert(schema.importJobParagraphs).values({ jobId, ...paragraph });
    }

    async bulkInsertParagraphs(jobId: string, data: BulkInsertParagraphsInput) {
        if (data.paragraphs.length === 0) return;

        const statements = data.paragraphs.map((paragraph) =>
            this.prepareInsertParagraph(jobId, paragraph)
        );
        await this.db.batch(statements as Parameters<AppDb["batch"]>[0] & unknown[]);
    }

    async countParagraphs(jobId: string) {
        const [row] = await this.db
            .select({ value: count() })
            .from(schema.importJobParagraphs)
            .where(eq(schema.importJobParagraphs.jobId, jobId));
        return row?.value ?? 0;
    }

    async getParagraph(jobId: string, paragraphId: string) {
        const row = await this.db.query.importJobParagraphs.findFirst({
            where: and(
                eq(schema.importJobParagraphs.id, paragraphId),
                eq(schema.importJobParagraphs.jobId, jobId)
            ),
        });
        return row ?? null;
    }

    async updateParagraph(jobId: string, paragraphId: string, data: UpdateImportParagraphInput) {
        const [row] = await this.db
            .update(schema.importJobParagraphs)
            .set(data)
            .where(
                and(
                    eq(schema.importJobParagraphs.id, paragraphId),
                    eq(schema.importJobParagraphs.jobId, jobId)
                )
            )
            .returning();
        return row ?? null;
    }

    async getActiveParagraphs(jobId: string) {
        return this.db.query.importJobParagraphs.findMany({
            where: and(
                eq(schema.importJobParagraphs.jobId, jobId),
                eq(schema.importJobParagraphs.isDeleted, 0)
            ),
            orderBy: [
                asc(schema.importJobParagraphs.pageNumber),
                asc(schema.importJobParagraphs.paragraphIndex),
            ],
        });
    }

    async claimNextPendingParagraph(jobId: string) {
        const next = await this.db.query.importJobParagraphs.findFirst({
            where: and(
                eq(schema.importJobParagraphs.jobId, jobId),
                eq(schema.importJobParagraphs.cleanStatus, "pending"),
                eq(schema.importJobParagraphs.isDeleted, 0)
            ),
            orderBy: [
                asc(schema.importJobParagraphs.pageNumber),
                asc(schema.importJobParagraphs.paragraphIndex),
            ],
        });
        if (!next) return null;

        const [claimed] = await this.db
            .update(schema.importJobParagraphs)
            .set({ cleanStatus: "cleaning" })
            .where(
                and(
                    eq(schema.importJobParagraphs.id, next.id),
                    eq(schema.importJobParagraphs.cleanStatus, "pending")
                )
            )
            .returning();
        return claimed ?? null;
    }
}
