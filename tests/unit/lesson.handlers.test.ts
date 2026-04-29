import { NotFoundError } from "@api/errors/app.error";
import { LessonHandlers } from "@api/routes/orgs/lesson.handlers";
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

vi.mock("@api/factories/repository.factory", () => ({
    getLessonRepository: () => mockRepo,
}));

vi.mock("@api/factories/upload.factory", () => ({
    getUploadService: () => mockUploadService,
}));

describe("LessonHandlers.updateLesson", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not delete old cover art when update returns null", async () => {
        mockRepo.findById.mockResolvedValueOnce({
            id: "lesson_1",
            organizationId: "org_1",
            title: "Lesson",
            description: null,
            coverArtUrl: "https://old-cover",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        mockUploadService.getVerifiedImageUploadUrl.mockResolvedValueOnce("https://new-cover");
        mockRepo.update.mockResolvedValueOnce(null);

        const ctx = {
            req: {
                valid: (source: "param" | "json") =>
                    source === "param"
                        ? { organizationId: "org_1", lessonId: "lesson_1" }
                        : { title: "Updated", coverArtUploadId: "upload_1" },
            },
            json: vi.fn(),
        } as any;

        await expect(LessonHandlers.updateLesson(ctx, undefined as never)).rejects.toBeInstanceOf(
            NotFoundError
        );
        expect(mockUploadService.deleteUploadByUrlGlobalSafely).not.toHaveBeenCalled();
    });
});

describe("LessonHandlers.deleteLesson", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not delete cover art when repository delete fails", async () => {
        mockRepo.findById.mockResolvedValueOnce({
            id: "lesson_1",
            organizationId: "org_1",
            title: "Lesson",
            description: null,
            coverArtUrl: "https://old-cover",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        mockRepo.delete.mockResolvedValueOnce(false);

        const ctx = {
            req: {
                valid: () => ({ organizationId: "org_1", lessonId: "lesson_1" }),
            },
            body: vi.fn(),
        } as any;

        await expect(LessonHandlers.deleteLesson(ctx, undefined as never)).rejects.toBeInstanceOf(
            NotFoundError
        );
        expect(mockUploadService.deleteUploadByUrlGlobalSafely).not.toHaveBeenCalled();
    });
});
