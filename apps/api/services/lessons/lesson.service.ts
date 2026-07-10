import { NotFoundError } from "@api/errors/app.error";
import type { LessonRepository } from "@api/repositories/lessons/lesson.repository";
import type { UploadService } from "@api/services/media/upload.service";
import type { CefrLevel } from "@shared/constants/cefr";
import type { Lesson } from "@shared/db/schema";
import { BaseService } from "../base.service";

export class LessonService extends BaseService {
    constructor(
        private readonly lessonRepo: LessonRepository,
        private readonly uploadService: UploadService
    ) {
        super();
    }

    async listByOrganization(params: {
        organizationId: string;
        limit?: number;
        cursor?: string;
        direction?: "next" | "prev";
        search?: string;
        hasCoverArt?: "all" | "with" | "without";
    }) {
        return this.lessonRepo.listByOrganization(params);
    }

    async getLesson(organizationId: string, lessonId: string): Promise<Lesson> {
        const lesson = await this.lessonRepo.findById(organizationId, lessonId);
        return this.assertExists(lesson, "Lesson not found");
    }

    async createLesson(
        organizationId: string,
        input: {
            title: string;
            description?: string | null;
            coverArtUploadId?: string;
            cefrLevel?: CefrLevel | null;
        }
    ): Promise<Lesson> {
        let coverArtUrl: string | null = null;
        if (input.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(
                input.coverArtUploadId,
                organizationId
            );
        }

        return this.lessonRepo.create({
            organizationId,
            title: input.title,
            description: input.description ?? null,
            coverArtUrl,
            cefrLevel: input.cefrLevel ?? null,
        });
    }

    async updateLesson(
        organizationId: string,
        lessonId: string,
        input: {
            title?: string;
            description?: string | null;
            coverArtUploadId?: string;
            cefrLevel?: CefrLevel | null;
        }
    ): Promise<Lesson> {
        const currentLesson = await this.getLesson(organizationId, lessonId);

        let coverArtUrl: string | undefined;
        if (input.coverArtUploadId) {
            coverArtUrl = await this.uploadService.getVerifiedImageUploadUrl(
                input.coverArtUploadId,
                organizationId
            );
        }

        const lesson = await this.lessonRepo.update(organizationId, lessonId, {
            title: input.title,
            description: input.description,
            ...(coverArtUrl !== undefined ? { coverArtUrl } : {}),
            ...(input.cefrLevel !== undefined ? { cefrLevel: input.cefrLevel } : {}),
        });

        const updated = this.assertExists(lesson, "Lesson not found");

        if (coverArtUrl !== undefined && currentLesson.coverArtUrl) {
            await this.uploadService.deleteUploadByUrlGlobalSafely(currentLesson.coverArtUrl);
        }

        return updated;
    }

    async deleteLesson(organizationId: string, lessonId: string): Promise<void> {
        const lesson = await this.getLesson(organizationId, lessonId);

        const deleted = await this.lessonRepo.delete(organizationId, lessonId);
        if (!deleted) {
            throw new NotFoundError("Lesson not found");
        }

        if (lesson.coverArtUrl) {
            await this.uploadService.deleteUploadByUrlGlobalSafely(lesson.coverArtUrl);
        }
    }
}
