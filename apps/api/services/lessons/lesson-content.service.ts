import {
    ConflictError,
    InternalServerError,
    NotFoundError,
    UnprocessableEntityError,
} from "@api/errors/app.error";
import type { LessonRepository } from "@api/repositories/lessons/lesson.repository";
import type { LessonContentRepository } from "@api/repositories/lessons/lesson-content.repository";
import type { PassageService } from "@api/services/passages/passage.service";
import { BaseService } from "../base.service";

export function assertOrderedIdsMatchCurrent(currentIds: string[], orderedIds: string[]): void {
    if (new Set(orderedIds).size !== orderedIds.length) {
        throw new UnprocessableEntityError("orderedIds must not contain duplicates");
    }
    if (currentIds.length !== orderedIds.length) {
        throw new UnprocessableEntityError("orderedIds must include each item exactly once");
    }
    const sortedCur = [...currentIds].sort().join("\0");
    const sortedNew = [...orderedIds].sort().join("\0");
    if (sortedCur !== sortedNew) {
        throw new UnprocessableEntityError("orderedIds must match the current items");
    }
}

export class LessonContentService extends BaseService {
    constructor(
        private readonly lessonRepo: LessonRepository,
        private readonly contentRepo: LessonContentRepository,
        private readonly passageService: PassageService
    ) {
        super();
    }

    private async assertLessonExists(organizationId: string, lessonId: string): Promise<void> {
        const lesson = await this.lessonRepo.findById(organizationId, lessonId);
        if (!lesson) {
            throw new NotFoundError("Lesson not found");
        }
    }

    async listObjectives(organizationId: string, lessonId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        return this.contentRepo.listObjectives(lessonId);
    }

    async replaceObjectives(organizationId: string, lessonId: string, objectives: string[]) {
        await this.assertLessonExists(organizationId, lessonId);
        return this.contentRepo.replaceObjectives(lessonId, objectives);
    }

    async reorderObjectives(organizationId: string, lessonId: string, orderedIds: string[]) {
        await this.assertLessonExists(organizationId, lessonId);
        const current = await this.contentRepo.listObjectives(lessonId);
        assertOrderedIdsMatchCurrent(
            current.map((o) => o.id),
            orderedIds
        );
        return this.contentRepo.reorderObjectives(lessonId, orderedIds);
    }

    async listPlaylists(organizationId: string, lessonId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        return this.contentRepo.listPlaylists(lessonId);
    }

    async addPlaylist(organizationId: string, lessonId: string, playlistId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        const existing = await this.contentRepo.listPlaylists(lessonId);
        const position = existing.length + 1;
        const row = await this.contentRepo.addPlaylist(lessonId, playlistId, position);
        if (!row) {
            throw new ConflictError("This playlist is already linked to this lesson");
        }
        return row;
    }

    async removePlaylist(organizationId: string, lessonId: string, playlistId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        const ok = await this.contentRepo.removePlaylist(lessonId, playlistId);
        if (!ok) {
            throw new NotFoundError("Playlist not linked to this lesson");
        }
    }

    async reorderPlaylists(organizationId: string, lessonId: string, orderedIds: string[]) {
        await this.assertLessonExists(organizationId, lessonId);
        const current = await this.contentRepo.listPlaylists(lessonId);
        assertOrderedIdsMatchCurrent(
            current.map((r) => r.playlistId),
            orderedIds
        );
        return this.contentRepo.reorderPlaylists(lessonId, orderedIds);
    }

    async listVocabulary(organizationId: string, lessonId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        return this.contentRepo.listVocabulary(lessonId);
    }

    async addVocabulary(organizationId: string, lessonId: string, vocabularyId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        const existing = await this.contentRepo.listVocabulary(lessonId);
        const position = existing.length + 1;
        const row = await this.contentRepo.addVocabulary(lessonId, vocabularyId, position);
        if (!row) {
            throw new ConflictError("This vocabulary item is already linked to this lesson");
        }
        return row;
    }

    async removeVocabulary(organizationId: string, lessonId: string, vocabularyId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        const ok = await this.contentRepo.removeVocabulary(lessonId, vocabularyId);
        if (!ok) {
            throw new NotFoundError("Vocabulary word not linked to this lesson");
        }
    }

    async reorderVocabulary(organizationId: string, lessonId: string, orderedIds: string[]) {
        await this.assertLessonExists(organizationId, lessonId);
        const current = await this.contentRepo.listVocabulary(lessonId);
        assertOrderedIdsMatchCurrent(
            current.map((r) => r.vocabularyId),
            orderedIds
        );
        return this.contentRepo.reorderVocabulary(lessonId, orderedIds);
    }

    async listPassages(organizationId: string, lessonId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        return this.contentRepo.listPassages(lessonId);
    }

    async addPassage(organizationId: string, lessonId: string, passageId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        await this.passageService.getPassage(organizationId, passageId);
        if (await this.contentRepo.hasPassageLink(lessonId, passageId)) {
            throw new ConflictError("This passage is already linked to this lesson");
        }
        const row = await this.contentRepo.addPassage(lessonId, passageId);
        if (!row) {
            throw new InternalServerError("Failed to link passage to lesson");
        }
        return row;
    }

    async removePassage(organizationId: string, lessonId: string, passageId: string) {
        await this.assertLessonExists(organizationId, lessonId);
        const ok = await this.contentRepo.removePassage(lessonId, passageId);
        if (!ok) {
            throw new NotFoundError("Passage not linked to this lesson");
        }
    }

    async reorderPassages(organizationId: string, lessonId: string, orderedIds: string[]) {
        await this.assertLessonExists(organizationId, lessonId);
        const current = await this.contentRepo.listPassages(lessonId);
        assertOrderedIdsMatchCurrent(
            current.map((r) => r.passageId),
            orderedIds
        );
        return this.contentRepo.reorderPassages(lessonId, orderedIds);
    }
}
