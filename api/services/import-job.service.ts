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
import {
    buildFullTipTapDoc,
    buildSingleParagraphTipTapDoc,
} from "@shared/utils/passage-content";
import { BaseService } from "./base.service";

const MAX_INLINE_CONTENT = 50_000;

export class ImportJobService extends BaseService {
    constructor(
        private readonly importRepo: ImportJobRepository,
        private readonly passageService: PassageService
    ) {
        super();
    }

    async createJob(organizationId: string, createdBy: string, data: CreateImportJobInput) {
        return this.importRepo.createJob(organizationId, createdBy, data);
    }

    async getJob(organizationId: string, jobId: string) {
        const job = await this.importRepo.getJob(organizationId, jobId);
        return this.assertExists(job, "Import job not found");
    }

    async listJobs(organizationId: string) {
        return this.importRepo.listJobs(organizationId);
    }

    async updateJob(organizationId: string, jobId: string, data: UpdateImportJobInput) {
        await this.getJob(organizationId, jobId);
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
        await this.getJob(organizationId, jobId);
        await this.importRepo.bulkInsertParagraphs(jobId, data);
        const totalParagraphs = await this.importRepo.countParagraphs(jobId);
        await this.importRepo.updateJob(organizationId, jobId, {
            status: "review",
            totalParagraphs,
        });
    }

    async updateParagraph(
        organizationId: string,
        jobId: string,
        paragraphId: string,
        data: UpdateImportParagraphInput
    ) {
        await this.getJob(organizationId, jobId);
        const para = await this.importRepo.getParagraph(jobId, paragraphId);
        this.assertExists(para, "Paragraph not found");
        const row = await this.importRepo.updateParagraph(jobId, paragraphId, data);
        return this.assertExists(row, "Paragraph not found");
    }

    async deleteParagraph(organizationId: string, jobId: string, paragraphId: string) {
        return this.updateParagraph(organizationId, jobId, paragraphId, { isDeleted: 1 });
    }

    async finalizeJob(organizationId: string, jobId: string, data: FinalizeImportInput) {
        const job = await this.getJob(organizationId, jobId);
        if (job.status !== "review") {
            throw new BadRequestError(
                `Job must be in "review" status to finalize; current status: "${job.status}"`
            );
        }
        const paragraphs = await this.importRepo.getActiveParagraphs(jobId);
        if (!paragraphs.length) {
            throw new BadRequestError("No paragraphs to finalize");
        }

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

        await this.importRepo.updateJob(organizationId, jobId, {
            status: "done",
            collectionId: collection.id,
        });

        return collection;
    }
}
