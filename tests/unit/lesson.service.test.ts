import { NotFoundError } from "@api/errors/app.error";
import { LessonService } from "@api/services/lessons/lesson.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRepo = {
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const mockUploadService = {
    getVerifiedImageUploadUrl: vi.fn(),
    deleteUploadByUrlGlobalSafely: vi.fn(),
};

describe("LessonService.updateLesson", () => {
    let service: LessonService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new LessonService(mockRepo as any, mockUploadService as any);
    });

    it("does not delete old cover art when update returns null", async () => {
        mockRepo.findById.mockResolvedValueOnce({
            id: "lesson_1",
            organizationId: "org_1",
            title: "Lesson",
            description: null,
            coverArtUrl: "https://old-cover",
            cefrLevel: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        mockUploadService.getVerifiedImageUploadUrl.mockResolvedValueOnce("https://new-cover");
        mockRepo.update.mockResolvedValueOnce(null);

        await expect(
            service.updateLesson("org_1", "lesson_1", {
                title: "Updated",
                coverArtUploadId: "upload_1",
            })
        ).rejects.toBeInstanceOf(NotFoundError);
        expect(mockUploadService.deleteUploadByUrlGlobalSafely).not.toHaveBeenCalled();
    });
});

describe("LessonService.deleteLesson", () => {
    let service: LessonService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new LessonService(mockRepo as any, mockUploadService as any);
    });

    it("does not delete cover art when repository delete fails", async () => {
        mockRepo.findById.mockResolvedValueOnce({
            id: "lesson_1",
            organizationId: "org_1",
            title: "Lesson",
            description: null,
            coverArtUrl: "https://old-cover",
            cefrLevel: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        mockRepo.delete.mockResolvedValueOnce(false);

        await expect(service.deleteLesson("org_1", "lesson_1")).rejects.toBeInstanceOf(
            NotFoundError
        );
        expect(mockUploadService.deleteUploadByUrlGlobalSafely).not.toHaveBeenCalled();
    });
});
