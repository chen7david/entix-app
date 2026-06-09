import { NotFoundError, UnprocessableEntityError } from "@api/errors/app.error";
import type { PassageRepository } from "@api/repositories/passage.repository";
import type {
    AddPassageImageInput,
    CreateCollectionInput,
    CreatePassageInput,
    UpdateCollectionInput,
    UpdatePassageInput,
} from "@shared/schemas/dto/passage.dto";
import type { PassageR2Content } from "@shared/types/text-collection-page.types";
import { countPassageWords } from "@shared/utils/passage-content";
import { BaseService } from "./base.service";
import type { BucketService } from "./bucket.service";
import type { UploadService } from "./upload.service";

const MAX_INLINE_CONTENT = 50_000;

export class PassageService extends BaseService {
    constructor(
        private readonly passageRepo: PassageRepository,
        private readonly bucketService: BucketService,
        private readonly uploadService: UploadService,
        private readonly publicUrlPrefix: string
    ) {
        super();
    }

    private publicUrl(bucketKey: string) {
        return `${this.publicUrlPrefix}/${bucketKey}`;
    }

    // ─── Collections ─────────────────────────────────────────────────────────

    async createCollection(organizationId: string, data: CreateCollectionInput) {
        return this.passageRepo.createCollection({
            organizationId,
            title: data.title,
            type: data.type,
            author: data.author ?? null,
            description: data.description ?? null,
            cefrLevel: data.cefrLevel ?? null,
        });
    }

    async getCollection(organizationId: string, id: string) {
        const row = await this.passageRepo.findCollectionById(organizationId, id);
        return this.assertExists(row, "Text collection not found");
    }

    async listCollections(
        organizationId: string,
        filters: {
            type?: CreateCollectionInput["type"];
            cursor?: string;
            limit?: number;
            direction?: "next" | "prev";
        }
    ) {
        return this.passageRepo.listCollectionsPaginated(organizationId, filters);
    }

    async updateCollection(organizationId: string, id: string, data: UpdateCollectionInput) {
        const row = await this.passageRepo.updateCollection(organizationId, id, data);
        return this.assertExists(row, "Text collection not found");
    }

    async deleteCollection(organizationId: string, id: string) {
        const ok = await this.passageRepo.deleteCollection(organizationId, id);
        if (!ok) {
            throw new NotFoundError("Text collection not found");
        }
    }

    // ─── Passages ────────────────────────────────────────────────────────────

    async createPassage(organizationId: string, data: CreatePassageInput) {
        if (data.content !== undefined && data.content.length > MAX_INLINE_CONTENT) {
            throw new UnprocessableEntityError(
                "Passage content exceeds 50 KB. Upload via R2 and set bucketKey instead."
            );
        }

        if (data.collectionId) {
            await this.getCollection(organizationId, data.collectionId);
        }

        const wordCount = data.content !== undefined ? countPassageWords(data.content) : null;
        const bucketKey = data.bucketKey ?? null;

        return this.passageRepo.createPassage({
            organizationId,
            collectionId: data.collectionId ?? null,
            title: data.title ?? null,
            type: data.type,
            cefrLevel: data.cefrLevel ?? null,
            content: bucketKey ? null : (data.content ?? null),
            bucketKey,
            r2Url: bucketKey ? this.publicUrl(bucketKey) : null,
            pageNumber: data.pageNumber ?? null,
            wordCount,
        });
    }

    async getPassage(organizationId: string, id: string) {
        const row = await this.passageRepo.findPassageById(organizationId, id);
        return this.assertExists(row, "Passage not found");
    }

    async listPassages(
        organizationId: string,
        filters: {
            collectionId?: string;
            type?: CreatePassageInput["type"];
            cefrLevel?: string;
            cursor?: string;
            limit?: number;
            direction?: "next" | "prev";
        }
    ) {
        return this.passageRepo.listPassagesPaginated(organizationId, filters);
    }

    async updatePassage(organizationId: string, id: string, data: UpdatePassageInput) {
        if (data.content !== undefined && data.content.length > MAX_INLINE_CONTENT) {
            throw new UnprocessableEntityError(
                "Passage content exceeds 50 KB. Upload via R2 and set bucketKey instead."
            );
        }

        if (data.collectionId) {
            await this.getCollection(organizationId, data.collectionId);
        }

        const patch: Parameters<PassageRepository["updatePassage"]>[2] = { ...data };
        if (data.content !== undefined) {
            patch.wordCount = countPassageWords(data.content);
            if (data.bucketKey === undefined) {
                patch.bucketKey = null;
                patch.r2Url = null;
            }
        }
        if (data.bucketKey !== undefined) {
            patch.r2Url = data.bucketKey ? this.publicUrl(data.bucketKey) : null;
            if (data.bucketKey) {
                patch.content = null;
            }
        }

        const row = await this.passageRepo.updatePassage(organizationId, id, patch);
        return this.assertExists(row, "Passage not found");
    }

    async deletePassage(organizationId: string, id: string) {
        const ok = await this.passageRepo.deletePassage(organizationId, id);
        if (!ok) {
            throw new NotFoundError("Passage not found");
        }
    }

    async getPassageContent(organizationId: string, id: string) {
        const passage = await this.getPassage(organizationId, id);
        const images = await this.passageRepo.listPassageImages(passage.id);

        let content: string | null = null;
        if (passage.content != null) {
            content = passage.content;
        } else if (passage.bucketKey) {
            const raw = await this.bucketService.get(passage.bucketKey);
            const parsed = JSON.parse(raw) as PassageR2Content;
            content = parsed.content ?? null;
        }

        return { passage, content, images };
    }

    // ─── Passage images ──────────────────────────────────────────────────────

    async addPassageImage(organizationId: string, passageId: string, data: AddPassageImageInput) {
        await this.getPassage(organizationId, passageId);
        const imageUrl = await this.uploadService.getVerifiedImageUploadUrl(
            data.uploadId,
            organizationId
        );

        return this.passageRepo.addPassageImage({
            passageId,
            uploadId: data.uploadId,
            imageUrl,
            altText: data.altText ?? null,
            caption: data.caption ?? null,
            position: data.position,
            sortOrder: data.sortOrder,
        });
    }

    async listPassageImages(organizationId: string, passageId: string) {
        await this.getPassage(organizationId, passageId);
        return this.passageRepo.listPassageImages(passageId);
    }

    async deletePassageImage(organizationId: string, passageId: string, imageId: string) {
        await this.getPassage(organizationId, passageId);
        const ok = await this.passageRepo.deletePassageImage(imageId, passageId);
        if (!ok) {
            throw new NotFoundError("Passage image not found");
        }
    }

    async createLargePassageUploadUrl(
        organizationId: string,
        collectionId: string,
        pageNumber: number
    ) {
        await this.getCollection(organizationId, collectionId);
        const bucketKey = `text-collections/${organizationId}/${collectionId}/page-${pageNumber}.json`;
        const presignedUrl = await this.bucketService.getPresignedUploadUrl(bucketKey);
        return {
            bucketKey,
            presignedUrl,
            url: this.publicUrl(bucketKey),
        };
    }
}
