import { BadRequestError, NotFoundError } from "@api/errors/app.error";
import type { ImportJobRepository } from "@api/repositories/import-job.repository";
import type { PassageService } from "@api/services/passage.service";
import type {
    BulkInsertParagraphsInput,
    CreateImportJobInput,
    FinalizeImportInput,
    UpdateImportJobInput,
    UpdateImportParagraphInput,
} from "@shared/schemas/dto/import-job.dto";
import { buildFullTipTapDoc, buildSingleParagraphTipTapDoc } from "@shared/utils/passage-content";
import { BaseService } from "./base.service";

const MAX_INLINE_CONTENT = 50_000;
const MUTABLE_JOB_STATUSES = new Set(["uploading", "review"]);
const PARAGRAPH_MUTABLE_STATUSES = new Set(["uploading", "review", "finalizing"]);

export class ImportJobService extends BaseService {
    constructor(
        private readonly importRepo: ImportJobRepository,
        private readonly passageService: PassageService
    ) {
        super();
    }

    async createJob(organizationId: string, createdBy: string, data: CreateImportJobInput) {
        const row = await this.importRepo.createJob(organizationId, createdBy, data);
        return this.assertExists(row, "Failed to create import job");
    }

    async getJob(organizationId: string, jobId: string) {
        const job = await this.importRepo.getJob(organizationId, jobId);
        return this.assertExists(job, "Import job not found");
    }

    async listJobs(organizationId: string) {
        return this.importRepo.listJobs(organizationId);
    }

    async updateJob(organizationId: string, jobId: string, data: UpdateImportJobInput) {
        const job = await this.getJob(organizationId, jobId);
        if (!MUTABLE_JOB_STATUSES.has(job.status)) {
            throw new BadRequestError(`Import job in "${job.status}" status cannot be updated`);
        }
        const row = await this.importRepo.updateJob(organizationId, jobId, data);
        return this.assertExists(row, "Import job not found");
    }

    async deleteJob(organizationId: string, jobId: string) {
        await this.getJob(organizationId, jobId);
        const ok = await this.importRepo.deleteJob(organizationId, jobId);
        if (!ok) {
            throw new NotFoundError("Import job not found");
        }
    }

    async bulkInsertParagraphs(
        organizationId: string,
        jobId: string,
        data: BulkInsertParagraphsInput
    ) {
        const job = await this.getJob(organizationId, jobId);
        if (!MUTABLE_JOB_STATUSES.has(job.status)) {
            throw new BadRequestError(
                `Cannot add paragraphs while job is in "${job.status}" status`
            );
        }

        const existingCount = await this.importRepo.countActiveParagraphs(jobId);
        await this.importRepo.bulkInsertParagraphs(
            jobId,
            data,
            existingCount + data.paragraphs.length
        );
    }

    private assertParagraphsMutable(status: string) {
        if (!PARAGRAPH_MUTABLE_STATUSES.has(status)) {
            throw new BadRequestError(`Paragraphs cannot be modified while job is "${status}"`);
        }
    }

    async updateParagraph(
        organizationId: string,
        jobId: string,
        paragraphId: string,
        data: UpdateImportParagraphInput
    ) {
        const job = await this.getJob(organizationId, jobId);
        this.assertParagraphsMutable(job.status);
        const para = await this.importRepo.getParagraph(jobId, paragraphId);
        this.assertExists(para, "Paragraph not found");
        const row = await this.importRepo.updateParagraph(jobId, paragraphId, data);
        return this.assertExists(row, "Paragraph not found");
    }

    async deleteParagraph(organizationId: string, jobId: string, paragraphId: string) {
        return this.updateParagraph(organizationId, jobId, paragraphId, { isDeleted: 1 });
    }

    async finalizeJob(organizationId: string, jobId: string, data: FinalizeImportInput) {
        const claimed = await this.importRepo.claimJobForFinalize(organizationId, jobId);
        if (!claimed) {
            const job = await this.importRepo.getJob(organizationId, jobId);
            if (job?.status === "done" && job.collectionId) {
                return this.passageService.getCollection(organizationId, job.collectionId);
            }
            throw new BadRequestError(
                `Job must be in "review" status to finalize; current status: "${job?.status ?? "unknown"}"`
            );
        }

        const paragraphs = await this.importRepo.getActiveParagraphs(jobId);
        if (!paragraphs.length) {
            await this.importRepo.releaseJobFromFinalize(organizationId, jobId);
            throw new BadRequestError("No paragraphs to finalize");
        }

        try {
            const collection = await this.passageService.createCollection(organizationId, {
                title: data.title,
                type: "book",
                author: data.author,
                description: data.description,
                cefrLevel: data.cefrLevel,
            });

            if (data.mode === "per_paragraph") {
                for (const para of paragraphs) {
                    const text = para.cleanedText ?? para.rawText;
                    const content = JSON.stringify(buildSingleParagraphTipTapDoc(text));
                    await this.passageService.createPassage(organizationId, {
                        collectionId: collection.id,
                        title: `${data.title} — p.${para.pageNumber} §${para.paragraphIndex + 1}`,
                        type: "reading",
                        cefrLevel: data.cefrLevel,
                        pageNumber: para.pageNumber,
                        content,
                    });
                }
            } else {
                const doc = buildFullTipTapDoc(paragraphs.map((p) => p.cleanedText ?? p.rawText));
                const content = JSON.stringify(doc);
                if (content.length > MAX_INLINE_CONTENT) {
                    throw new BadRequestError(
                        "Imported text exceeds 50 KB for a single passage. Use “one passage per paragraph” mode or shorten the text."
                    );
                }
                await this.passageService.createPassage(organizationId, {
                    collectionId: collection.id,
                    title: data.title,
                    type: "reading",
                    cefrLevel: data.cefrLevel,
                    content,
                });
            }

            const row = await this.importRepo.updateJob(organizationId, jobId, {
                status: "done",
                collectionId: collection.id,
            });
            this.assertExists(row, "Import job not found after finalize");

            return collection;
        } catch (error) {
            await this.importRepo.releaseJobFromFinalize(organizationId, jobId);
            throw error;
        }
    }
}
