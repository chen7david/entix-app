import type { AppDb } from "@api/factories/db.factory";
import { IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE } from "@shared/constants/import";
import * as schema from "@shared/db/schema";
import type {
    BulkInsertParagraphsInput,
    CreateImportJobInput,
    ImportJobInternalUpdate,
    ImportParagraphItem,
    UpdateImportParagraphInput,
} from "@shared/schemas/dto/import-job.dto";
import { and, asc, count, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

export class ImportJobRepository {
    constructor(private readonly db: AppDb) {}

    async createJob(organizationId: string, createdBy: string, data: CreateImportJobInput) {
        const [row] = await this.db
            .insert(schema.importJobs)
            .values({ organizationId, createdBy, ...data })
            .returning();
        return row ?? null;
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

    async updateJob(organizationId: string, jobId: string, data: ImportJobInternalUpdate) {
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

    /**
     * Atomically move a job from `review` → `finalizing` so only one finalize can proceed.
     */
    async claimJobForFinalize(organizationId: string, jobId: string) {
        const [row] = await this.db
            .update(schema.importJobs)
            .set({ status: "finalizing" })
            .where(
                and(
                    eq(schema.importJobs.id, jobId),
                    eq(schema.importJobs.organizationId, organizationId),
                    eq(schema.importJobs.status, "review")
                )
            )
            .returning();
        return row ?? null;
    }

    async releaseJobFromFinalize(organizationId: string, jobId: string) {
        await this.db
            .update(schema.importJobs)
            .set({ status: "review" })
            .where(
                and(
                    eq(schema.importJobs.id, jobId),
                    eq(schema.importJobs.organizationId, organizationId),
                    eq(schema.importJobs.status, "finalizing")
                )
            );
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

    async bulkInsertParagraphs(
        jobId: string,
        data: BulkInsertParagraphsInput,
        totalParagraphs: number
    ) {
        if (data.paragraphs.length === 0) return;

        const insertStatements = data.paragraphs.map((paragraph) =>
            this.prepareInsertParagraph(jobId, paragraph)
        ) as BatchItem<"sqlite">[];

        for (let i = 0; i < insertStatements.length; i += IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE) {
            const chunk = insertStatements.slice(i, i + IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE);
            await this.db.batch(chunk as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
        }

        await this.db
            .update(schema.importJobs)
            .set({ status: "review", totalParagraphs })
            .where(eq(schema.importJobs.id, jobId));
    }

    async countActiveParagraphs(jobId: string) {
        const [row] = await this.db
            .select({ value: count() })
            .from(schema.importJobParagraphs)
            .where(
                and(
                    eq(schema.importJobParagraphs.jobId, jobId),
                    eq(schema.importJobParagraphs.isDeleted, 0)
                )
            );
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
}
